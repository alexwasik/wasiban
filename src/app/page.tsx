import { BoardList } from "@/components/boards/BoardList";
import { getBoards } from "@/lib/db/boards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boards = await getBoards();

  return (
    <div>
      <BoardList initialBoards={boards} />
    </div>
  );
}
