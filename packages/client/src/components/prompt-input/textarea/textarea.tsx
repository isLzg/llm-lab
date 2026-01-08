type TextareaProps = {
  placeholder: string;
  rows: number;
  style: React.CSSProperties;
};

export const Textarea = ({ placeholder, rows, style }: TextareaProps) => {
  return (
    <div className="overflow-y-auto pl-4 pr-2">
      <textarea
        className="flex rounded-md border-input focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden flex-1 bg-transparent p-0 pt-px border-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-[var(--text-disable)] text-[15px] shadow-none resize-none leading-[24px] min-h-[40px]"
        placeholder={placeholder}
        rows={rows}
        style={style}
      >
        111
      </textarea>
    </div>
  );
};
