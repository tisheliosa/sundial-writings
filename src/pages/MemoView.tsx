import { useNavigate, useParams } from "react-router-dom";
import { useMemo_byId } from "../hooks/useMemos";
import "../styles/memoView.css";

export function MemoView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = Number(id);
  const memo = useMemo_byId(numericId);

  if (!Number.isFinite(numericId) || !memo) {
    return (
      <div className="memo-view">
        <div className="memo-view__body">
          <p>memo not found.</p>
          <button className="memo-view__back" onClick={() => navigate("/whatisthetime")}>
            back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="memo-view">
      <button className="memo-view__back" onClick={() => navigate("/whatisthetime")} aria-label="Back">
        ←
      </button>
      <div className="memo-view__body">
        <h1 className="memo-view__title">{memo.title}</h1>
        <p className="memo-view__text">{memo.body}</p>
        <time className="memo-view__date">{memo.createdAt}</time>
      </div>
    </div>
  );
}
