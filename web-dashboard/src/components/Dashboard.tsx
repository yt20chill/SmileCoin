import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Restaurant Dashboard
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Web dashboard initialized with Tailwind CSS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Daily Statistics
              </h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Total Coins Received
              </h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tourist Origins
              </h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;