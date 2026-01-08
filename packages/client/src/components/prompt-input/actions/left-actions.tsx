import { IconButton } from "../../icon-button";
import { Plus, Cable } from "lucide-react";

export const LeftActions = () => {
  return (
    <div className="flex gap-2 items-center shrink-0">
      <IconButton>
        <Plus />
      </IconButton>

      <IconButton>
        <Cable />
      </IconButton>
    </div>
  );
};
