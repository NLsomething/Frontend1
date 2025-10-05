import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Classroom Booking System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Welcome to our classroom booking platform. Reserve classrooms efficiently 
            and manage your educational space needs with ease.
          </p>
          
          <div className="space-y-6">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg 
                       transform transition-all duration-200 hover:scale-105 shadow-lg text-lg"
            >
              Back to Login
            </button>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">🏫</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Multiple Locations
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Book classrooms across different buildings and campuses
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="text-green-600 text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Real-time Availability
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Check live availability and make instant reservations
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="text-purple-600 text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Easy Scheduling
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Simple interface for managing your classroom bookings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage