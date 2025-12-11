import { Skeleton } from "@workspace/ui/components/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="bg-primary text-primary-foreground body-font top-0 z-50">
      <div className="mx-auto flex flex-col sm:flex-row items-center gap-8 justify-between p-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          header
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
    </header>
  );
}
