import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function Reports() {
  // Dummy sales data
  const data = [
    { day: "Mon", sales: 400 },
    { day: "Tue", sales: 300 },
    { day: "Wed", sales: 500 },
    { day: "Thu", sales: 200 },
    { day: "Fri", sales: 700 },
    { day: "Sat", sales: 600 },
    { day: "Sun", sales: 800 }
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-green-900 mb-6">
        Reports & Sales Analysis
      </h2>

      {/* SALES CHART*/}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 text-green-900">

          Weekly Sales
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#16a34a" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip 
              contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px"}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
