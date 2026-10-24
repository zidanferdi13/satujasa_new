import { auth } from "@/lib/auth";

export default async function OwnerDashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Welcome, {session?.user?.name}</h2>
          <p className="text-gray-600">
            Organization: {session?.user?.organizationId || "None"}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Total Operators</h3>
            <p className="text-3xl font-bold mt-2">-</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2">-</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Active Files</h3>
            <p className="text-3xl font-bold mt-2">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
