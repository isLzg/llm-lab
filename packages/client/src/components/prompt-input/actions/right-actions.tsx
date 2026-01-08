import { ArrowUp } from "lucide-react";
import { IconButton } from "../../icon-button";

export const RightActions = () => {
  return (
    <div className="min-w-0 flex gap-2 ml-auto shrink items-center">
      <IconButton className="">
        <ArrowUp className="fill-none" />
      </IconButton>
    </div>
  );
};
