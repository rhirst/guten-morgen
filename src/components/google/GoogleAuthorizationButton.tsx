import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/providers/GoogleAuthProvider";

export function GoogleAuthorizationButton() {
  const {
    authorize,
    disconnect,
    isAuthorized,
    isAuthorizing,
    error,
  } = useGoogleAuth();

  if (isAuthorized) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Google Calendar & Tasks connected
        </span>

        <Button
          variant="outline"
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={authorize}
        disabled={isAuthorizing}
      >
        {isAuthorizing
          ? "Connecting..."
          : "Connect Google Calendar & Tasks"}
      </Button>

      {error && (
        <p className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}