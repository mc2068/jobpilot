import { CircleAlert, CircleCheck } from "lucide-react";

type Props = {
  success: boolean;
  message: string;
  className?: string;
};

export function ResultMessage({ success, message, className = "" }: Props) {
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm text-text-dark ${
        success ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
      } ${className}`}
    >
      {success ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
      )}
      {message}
    </div>
  );
}
