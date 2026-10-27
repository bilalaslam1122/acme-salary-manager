import { DirectorySkeleton } from "@/components/employees/directory-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Employees</h1>
      <DirectorySkeleton />
    </div>
  );
}
