# Task b4a: Breakout Rooms Widget

## Files Created
- `src/components/room/widgets/BreakoutRoomsWidget.tsx` — UI-only breakout rooms widget

## Implementation Details
- Uses `useCollabStore` to get remote participants (students)
- Configurable number of rooms (2-10) with +/- controls
- Two assignment strategies: "Assign Randomly" (shuffled) and "Auto" (round-robin in order)
- Each room shows: room number badge, group name, member count, member chips
- Per-room broadcast: inline input sends to ChatMessage table with `[Breakout - Group X]` prefix
- Global broadcast: input at bottom sends with `[Broadcast to All]` prefix
- "End Breakout" and "Bring All Back" buttons both reset the widget state
- Empty state when no students are present
- Color-coded room borders (green, blue, yellow, etc.)
- All messages sent to the chat system via direct Supabase insert
