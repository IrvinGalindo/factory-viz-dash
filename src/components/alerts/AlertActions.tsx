import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface AlertActionsProps {
  alertId: string;
  status: string | null;
  comment: string;
  resolveNote: string;
  processing: boolean;
  onCommentChange: (comment: string) => void;
  onResolveNoteChange: (note: string) => void;
  onAcknowledge: () => void;
  onResolve: () => void;
}

export const AlertActions = memo(
  ({
    alertId,
    status,
    comment,
    resolveNote,
    processing,
    onCommentChange,
    onResolveNoteChange,
    onAcknowledge,
    onResolve,
  }: AlertActionsProps) => {
    const { t } = useLanguage();
    if (status === "resolved") {
      return null;
    }

    return (
      <div className="flex items-center gap-2 min-w-[500px]">
        {status !== "acknowledged" && (
          <>
            <Textarea
              placeholder={t('comment_placeholder')}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[40px] max-h-[60px] text-xs flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onAcknowledge}
              disabled={processing || !comment.trim()}
            >
              <Check className="h-3 w-3 mr-1" />
              {t('acknowledge_button')}
            </Button>
          </>
        )}
        {status === "acknowledged" && (
          <>
            <Textarea
              placeholder={t('resolve_note_placeholder')}
              value={resolveNote}
              onChange={(e) => onResolveNoteChange(e.target.value)}
              className="min-h-[40px] max-h-[60px] text-xs flex-1"
            />
            <Button
              variant="default"
              size="sm"
              onClick={onResolve}
              disabled={processing || !resolveNote.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('resolve_button')}
            </Button>
          </>
        )}
        {status !== "acknowledged" && (
          <Button
            variant="default"
            size="sm"
            onClick={onResolve}
            disabled={processing || !resolveNote.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('resolve_button')}
          </Button>
        )}
      </div>
    );
  }
);

AlertActions.displayName = "AlertActions";
