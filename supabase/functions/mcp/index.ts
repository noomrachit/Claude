// MCP server for the Kanban app, deployed as a Supabase Edge Function.
//
// Auth: every request must carry `Authorization: Bearer <user access token>` (a Supabase Auth JWT).
// All queries run as that user with the publishable key, so the database RLS policies decide what
// each tool can read or change — this function never uses a secret / service_role key.
import '@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { generateKeyBetween } from 'fractional-indexing'
import { Hono } from 'hono'
import { z } from 'zod'
import { bearerToken, fail, likePattern, neighboursFor, ok, publishableKey, shapeBoard } from './lib.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const API_KEY = publishableKey(Deno.env)

interface BoardRow { id: string; title: string; archived_at: string | null; updated_at: string }

function buildServer(db: SupabaseClient, userId: string) {
  const server = new McpServer({ name: 'kanban', version: '0.1.0' })

  server.registerTool(
    'list_boards',
    {
      title: 'List boards',
      description: 'List the boards the signed-in user is a member of, with their role.',
      inputSchema: { include_archived: z.boolean().optional().describe('Also return archived boards') },
      annotations: { readOnlyHint: true },
    },
    async ({ include_archived }) => {
      // RLS returns every membership row of boards we belong to, so filter to our own rows.
      const { data, error } = await db
        .from('board_members')
        .select('role, boards(id, title, archived_at, updated_at)')
        .eq('user_id', userId)
      if (error) return fail(error.message)
      const rows = (data ?? []) as unknown as { role: string; boards: BoardRow | null }[]
      const boards = rows
        .flatMap((r) => (r.boards ? [{ ...r.boards, role: r.role }] : []))
        .filter((b) => include_archived || !b.archived_at)
      return ok(boards)
    },
  )

  server.registerTool(
    'get_board',
    {
      title: 'Get board',
      description: 'Return a board as its lists with their cards (in display order), including labels and due dates.',
      inputSchema: { board_id: z.guid() },
      annotations: { readOnlyHint: true },
    },
    async ({ board_id }) => {
      const [lists, cards, labels, cardLabels] = await Promise.all([
        db.from('lists').select('id, title, position').eq('board_id', board_id),
        db.from('cards').select('id, list_id, title, description, due_date, position').eq('board_id', board_id).is('archived_at', null),
        db.from('labels').select('id, name, color').eq('board_id', board_id),
        db.from('card_labels').select('card_id, label_id').eq('board_id', board_id),
      ])
      const error = lists.error ?? cards.error ?? labels.error ?? cardLabels.error
      if (error) return fail(error.message)
      if (!lists.data?.length) return fail('Board not found, empty, or you are not a member.')
      return ok(shapeBoard(lists.data, cards.data ?? [], labels.data ?? [], cardLabels.data ?? []))
    },
  )

  server.registerTool(
    'search_cards',
    {
      title: 'Search cards',
      description: 'Find cards whose title or description contains the text, across all boards you can see or within one board.',
      inputSchema: {
        query: z.string().min(1).max(200),
        board_id: z.guid().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, board_id }) => {
      const pattern = likePattern(query)
      let q = db
        .from('cards')
        .select('id, board_id, list_id, title, due_date')
        .is('archived_at', null)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(50)
      if (board_id) q = q.eq('board_id', board_id)
      const { data, error } = await q
      if (error) return fail(error.message)
      return ok(data)
    },
  )

  server.registerTool(
    'create_card',
    {
      title: 'Create card',
      description: 'Add a card to the bottom of a list. Requires owner or editor role on the board.',
      inputSchema: {
        list_id: z.guid(),
        title: z.string().min(1).max(500),
        description: z.string().max(10000).optional(),
      },
    },
    async ({ list_id, title, description }) => {
      const list = await db.from('lists').select('board_id').eq('id', list_id).maybeSingle()
      if (list.error) return fail(list.error.message)
      if (!list.data) return fail('List not found or you are not a member of its board.')
      const siblings = await db.from('cards').select('id, position').eq('list_id', list_id)
      if (siblings.error) return fail(siblings.error.message)
      const { before, after } = neighboursFor('bottom', siblings.data ?? [])
      const { data, error } = await db
        .from('cards')
        .insert({ board_id: list.data.board_id, list_id, title, description: description ?? '', position: generateKeyBetween(before, after) })
        .select('id, list_id, title')
        .single()
      if (error) return fail(error.message)
      return ok(data)
    },
  )

  server.registerTool(
    'update_card',
    {
      title: 'Update card',
      description: 'Change a card title, description or due date (ISO 8601, or null to clear). Requires owner or editor role.',
      inputSchema: {
        card_id: z.guid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(10000).optional(),
        due_date: z.string().datetime({ offset: true }).nullable().optional(),
      },
    },
    async ({ card_id, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      if (Object.keys(fields).length === 0) return fail('Nothing to update.')
      const { data, error } = await db.from('cards').update(fields).eq('id', card_id).select('id, title, description, due_date')
      if (error) return fail(error.message)
      if (!data?.length) return fail('Card not found, or you do not have edit access to its board.')
      return ok(data[0])
    },
  )

  server.registerTool(
    'move_card',
    {
      title: 'Move card',
      description: 'Move a card to the top or bottom of a list on the same board. Requires owner or editor role.',
      inputSchema: {
        card_id: z.guid(),
        list_id: z.guid(),
        where: z.enum(['top', 'bottom']).default('bottom'),
      },
    },
    async ({ card_id, list_id, where }) => {
      const siblings = await db.from('cards').select('id, position').eq('list_id', list_id)
      if (siblings.error) return fail(siblings.error.message)
      const { before, after } = neighboursFor(where, siblings.data ?? [], card_id)
      const { data, error } = await db
        .from('cards')
        .update({ list_id, position: generateKeyBetween(before, after) })
        .eq('id', card_id)
        .select('id, list_id, title')
      // A list from another board fails the composite foreign key, so cards cannot cross boards.
      if (error) return fail(error.message)
      if (!data?.length) return fail('Card not found, or you do not have edit access to its board.')
      return ok(data[0])
    },
  )

  server.registerTool(
    'add_comment',
    {
      title: 'Add comment',
      description: 'Post a comment on a card as the signed-in user. Requires owner or editor role.',
      inputSchema: { card_id: z.guid(), body: z.string().min(1).max(5000) },
    },
    async ({ card_id, body }) => {
      const card = await db.from('cards').select('board_id').eq('id', card_id).maybeSingle()
      if (card.error) return fail(card.error.message)
      if (!card.data) return fail('Card not found or you are not a member of its board.')
      const { data, error } = await db.from('comments').insert({ card_id, board_id: card.data.board_id, body }).select('id, created_at').single()
      if (error) return fail(error.message)
      return ok(data)
    },
  )

  return server
}

const app = new Hono()

app.all('*', async (c) => {
  if (!API_KEY) return c.json({ error: 'Server misconfigured: no publishable key available' }, 500)

  const token = bearerToken(c.req.header('Authorization'))
  if (!token) return c.json({ error: 'Missing Authorization: Bearer <access token>' }, 401)

  const db = createClient(SUPABASE_URL, API_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return c.json({ error: 'Invalid or expired access token' }, 401)

  // Stateless: a fresh server + transport per request, bound to this user's client.
  const server = buildServer(db, data.user.id)
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

Deno.serve(app.fetch)
