import ComponentCard from '@/components/common/ComponentCard';
import { TaskReportsTable } from '@/components/dashboard/task-reports-table';

export default function ReportsPage() {
  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Task Reports</h1>
        <p className="text-sm text-muted-foreground">
          View comprehensive logs of all task-related activities including submissions, reviews, and status changes.
        </p>
      </div>
        <ComponentCard title="Task Reports">
           <TaskReportsTable />
        </ComponentCard>
    </div>
  );
}
