import { getSessionUser } from "@/lib/auth";
import { getListCards } from "@/lib/trello";
import { TrelloCard } from "@/components/trello-card";

export async function TrelloList() {
  const user = await getSessionUser();
  if (!user) return null;

  let result;
  try {
    result = await getListCards(user.id);
  } catch {
    return null;
  }

  const { selection, cards } = result;

  return (
    <div className="flex flex-col grow gap-3">
      <h2 className="text-sm text-center font-semibold text-muted">
        {selection.boardName} / {selection.listName}
      </h2>
      {cards.length === 0 ? (
        <p className="text-sm text-muted">No cards in this list.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <li key={card.id}>
              <TrelloCard card={card} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
