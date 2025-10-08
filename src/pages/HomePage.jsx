import { useNavigate } from 'react-router-dom'

// Style classes
const styles = {
  screen: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800",
  container: "container mx-auto px-4 py-16",
  content: "text-center",
  titleLarge: "text-5xl font-bold text-gray-900 dark:text-white mb-6",
  subtitle: "text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto",
  section: "space-y-6",
  btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg text-lg",
  grid: "grid md:grid-cols-3 gap-8 mt-16",
  card: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md",
  icon: "text-4xl mb-4",
  iconBlue: "text-blue-600",
  iconGreen: "text-green-600",
  iconPurple: "text-purple-600",
  cardTitle: "text-xl font-semibold mb-2 text-gray-900 dark:text-white",
  cardText: "text-gray-600 dark:text-gray-300"
}

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.titleLarge}>
            ClassroomInsight
          </h1>
          <p className={styles.subtitle}>
            Welcome to ClassroomInsight. Reserve classrooms efficiently 
            and manage your educational space needs with ease.
          </p>
          
          <div className={styles.section}>
            <button
              onClick={() => navigate('/')}
              className={styles.btnPrimary}
            >
              Back to Login
            </button>
            
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={`${styles.icon} ${styles.iconBlue}`}>🏫</div>
                <h3 className={styles.cardTitle}>
                  Multiple Locations
                </h3>
                <p className={styles.cardText}>
                  Book classrooms across different buildings and campuses
                </p>
              </div>
              
              <div className={styles.card}>
                <div className={`${styles.icon} ${styles.iconGreen}`}>⏰</div>
                <h3 className={styles.cardTitle}>
                  Real-time Availability
                </h3>
                <p className={styles.cardText}>
                  Check live availability and make instant reservations
                </p>
              </div>
              
              <div className={styles.card}>
                <div className={`${styles.icon} ${styles.iconPurple}`}>📅</div>
                <h3 className={styles.cardTitle}>
                  Easy Scheduling
                </h3>
                <p className={styles.cardText}>
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