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

  // Split the body into paragraphs on any newline (including consecutive
  // blank lines). Normalize CRLF -> LF first, trim leading/trailing
  // whitespace, and drop any empty fragments.
  const paragraphs = memo.body
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="memo-view">
      <button className="memo-view__back" onClick={() => navigate("/whatisthetime")} aria-label="Back">
        ←
      </button>
      <div className="memo-view__body">
        <h1 className="memo-view__title">{memo.title}</h1>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="memo-view__text">
            {paragraph}
          </p>
        ))}
        <time className="memo-view__date">{memo.createdAt}</time>
      </div>
    </div>
  );
}
