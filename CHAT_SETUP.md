# Chat Persistence & Memory Setup

Run the following SQL in your Supabase SQL Editor to enable chat history and AI memory.

## 1. Chat Conversations Table

```sql
create table if not exists chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_chat_conversations_user
  on chat_conversations(user_id, updated_at desc);
```

## 2. Chat Messages Table

```sql
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references chat_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  calendar_action jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_chat_messages_conversation
  on chat_messages(conversation_id, created_at);
```

## 3. Chat Memories Table

```sql
create table if not exists chat_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  category text not null default 'general',
  source_conversation_id uuid references chat_conversations(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_chat_memories_user
  on chat_memories(user_id, created_at desc);
```

## 4. Row Level Security

```sql
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table chat_memories enable row level security;

create policy "Users manage own conversations"
  on chat_conversations for all
  using (auth.uid() = user_id);

create policy "Users manage messages in own conversations"
  on chat_messages for all
  using (
    conversation_id in (
      select id from chat_conversations where user_id = auth.uid()
    )
  );

create policy "Users manage own memories"
  on chat_memories for all
  using (auth.uid() = user_id);
```

## 5. Auto-update timestamp trigger (optional)

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger chat_conversations_updated_at
  before update on chat_conversations
  for each row execute function update_updated_at();
```

## All-in-one (copy & paste)

```sql
-- Conversations
create table if not exists chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_chat_conversations_user
  on chat_conversations(user_id, updated_at desc);

-- Messages
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references chat_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  calendar_action jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_chat_messages_conversation
  on chat_messages(conversation_id, created_at);

-- Memories
create table if not exists chat_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  category text not null default 'general',
  source_conversation_id uuid references chat_conversations(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_chat_memories_user
  on chat_memories(user_id, created_at desc);

-- RLS
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table chat_memories enable row level security;

create policy "Users manage own conversations"
  on chat_conversations for all using (auth.uid() = user_id);

create policy "Users manage messages in own conversations"
  on chat_messages for all using (
    conversation_id in (select id from chat_conversations where user_id = auth.uid())
  );

create policy "Users manage own memories"
  on chat_memories for all using (auth.uid() = user_id);

-- Auto-update timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger chat_conversations_updated_at
  before update on chat_conversations
  for each row execute function update_updated_at();
```
