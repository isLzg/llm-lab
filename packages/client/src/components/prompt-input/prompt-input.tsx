import { LeftActions, RightActions } from "./actions";
import { Textarea } from "./textarea";

export const PromptInput = () => {
  return (
    <div className="flex flex-col w-full">
      <div className="relative bg-[var(--background-gray-main)]">
        <div className="flex flex-col gap-3 rounded-[22px] transition-all relative bg-[var(--fill-input-chat)] py-3 max-h-[312px] w-full z-2 shadow-[0px_12px_32px_0px_rgba(0,0,0,0.02)] border border-black/8 dark:border-[var(--border-main)]">
          <Textarea
            placeholder="分配一个任务或提问任何问题"
            rows={2}
            style={{ height: "49px" }}
          />
          <div className="px-3 flex gap-2 item-center">
            <LeftActions />
            <RightActions />
          </div>
        </div>
      </div>
    </div>
  );
};
