// backend/services/googleCalendarService.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// TEMPORARY: Using hardcoded holidays until google creds
class GoogleCalendarService {
  constructor() {
    this.cache = {};
  }

  /**
   * TEMPORARY: Initialize (does nothing, no credentials needed)
   */
  async initialize() {
    console.log('⚠ Using TEMPORARY hardcoded holidays (Google Calendar not configured)');
    console.log('  To enable Google Calendar: Set up credentials and update this file');
    return true;
  }

  /**
   * TEMPORARY: Return hardcoded Indian holidays
   */
  async getHolidaysWithCache(year) {
    console.log(`Using temporary hardcoded holidays for ${year}`);
    
    // Hardcoded Indian holidays for 2024-2026
    const hardcodedHolidays = {
      2024: [
        '2024-01-26', // Republic Day
        '2024-03-25', // Holi
        '2024-04-11', // Eid ul-Fitr
        '2024-04-17', // Ram Navami
        '2024-04-21', // Mahavir Jayanti
        '2024-05-23', // Buddha Purnima
        '2024-06-17', // Eid ul-Adha
        '2024-07-17', // Muharram
        '2024-08-15', // Independence Day
        '2024-08-26', // Janmashtami
        '2024-09-16', // Milad un-Nabi
        '2024-10-02', // Gandhi Jayanti
        '2024-10-12', // Dussehra
        '2024-11-01', // Diwali
        '2024-11-15', // Guru Nanak Jayanti
        '2024-12-25', // Christmas
      ],
      2025: [
        '2025-01-26', // Republic Day
        '2025-03-14', // Holi
        '2025-03-30', // Easter Sunday
        '2025-04-02', // Eid ul-Fitr (approx)
        '2025-04-10', // Eid ul-Adha (approx)
        '2025-04-18', // Good Friday
        '2025-05-23', // Buddha Purnima
        '2025-08-15', // Independence Day
        '2025-08-27', // Janmashtami
        '2025-09-16', // Muharram
        '2025-10-02', // Gandhi Jayanti
        '2025-10-20', // Dussehra
        '2025-10-29', // Diwali
        '2025-11-05', // Diwali (day 2)
        '2025-11-25', // Guru Nanak Jayanti
        '2025-12-25', // Christmas
      ],
      2026: [
        '2026-01-26', // Republic Day
        '2026-03-03', // Holi
        '2026-03-21', // Eid ul-Fitr (approx)
        '2026-03-30', // Eid ul-Adha (approx)
        '2026-04-02', // Good Friday
        '2026-05-15', // Buddha Purnima
        '2026-08-15', // Independence Day
        '2026-09-16', // Muharram
        '2026-10-02', // Gandhi Jayanti
        '2026-10-09', // Dussehra
        '2026-10-20', // Diwali
        '2026-11-14', // Guru Nanak Jayanti
        '2026-12-25', // Christmas
      ]
    };

    const holidays = hardcodedHolidays[year] || [];
    console.log(`  Found ${holidays.length} holidays for ${year}`);
    
    return holidays.map(date => ({ date }));
  }

  /**
   * TEMPORARY: Clear cache
   */
  clearCache(year = null) {
    console.log('Cache cleared (not needed for hardcoded holidays)');
  }
}


// class GoogleCalendarService {
//   constructor() {
//     this.auth = null;
//     this.calendar = null;
//     this.calendarId = process.env.GOOGLE_CALENDAR_ID;
//   }

//   /**
//    * Initialize Google Calendar API
//    * Uses service account credentials from environment
//    */
//   async initialize() {
//     try {
//       // Parse service account from environment variable
//       const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

//       this.auth = new google.auth.GoogleAuth({
//         credentials: serviceAccount,
//         scopes: ['https://www.googleapis.com/auth/calendar.readonly']
//       });

//       this.calendar = google.calendar({ version: 'v3', auth: this.auth });
//       console.log('✓ Google Calendar initialized successfully');
//     } catch (error) {
//       console.error('✗ Failed to initialize Google Calendar:', error.message);
//       throw new Error('Google Calendar initialization failed');
//     }
//   }

//   /**
//    * Ensure calendar is initialized
//    */
//   async ensureInitialized() {
//     if (!this.calendar) {
//       await this.initialize();
//     }
//   }

//   /**
//    * Get holidays from Google Calendar for a specific date range
//    * @param {string} startDate - YYYY-MM-DD format
//    * @param {string} endDate - YYYY-MM-DD format
//    * @returns {Array} Array of holiday objects with {date, name}
//    */
//   async getHolidaysByDateRange(startDate, endDate) {
//     try {
//       await this.ensureInitialized();

//       const response = await this.calendar.events.list({
//         calendarId: this.calendarId,
//         timeMin: `${startDate}T00:00:00Z`,
//         timeMax: `${endDate}T23:59:59Z`,
//         singleEvents: true,
//         orderBy: 'startTime',
//         maxResults: 250
//       });

//       const events = response.data.items || [];

//       return events
//         .filter(event => event.start && (event.start.date || event.start.dateTime))
//         .map(event => {
//           const date = event.start.date || event.start.dateTime.split('T')[0];
//           return {
//             date: date,
//             name: event.summary,
//             description: event.description || ''
//           };
//         })
//         .sort((a, b) => new Date(a.date) - new Date(b.date));

//     } catch (error) {
//       console.error('Error fetching holidays from Google Calendar:', error.message);
//       throw new Error(`Failed to fetch holidays: ${error.message}`);
//     }
//   }

//   /**
//    * Get holidays for a specific year
//    * @param {number} year - 4-digit year (e.g., 2024)
//    * @returns {Array} Array of holiday objects
//    */
//   async getHolidaysByYear(year) {
//     const startDate = `${year}-01-01`;
//     const endDate = `${year}-12-31`;
//     return this.getHolidaysByDateRange(startDate, endDate);
//   }

//   /**
//    * Get holidays for a specific month
//    * @param {number} year - 4-digit year
//    * @param {number} month - Month (1-12)
//    * @returns {Array} Array of holiday objects
//    */
//   async getHolidaysByMonth(year, month) {
//     const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
//     const lastDay = new Date(year, month, 0).getDate();
//     const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
//     return this.getHolidaysByDateRange(startDate, endDate);
//   }

//   /**
//    * Get holiday dates as array (just the dates, no names)
//    * @param {number} year - 4-digit year
//    * @returns {Array} Array of date strings in YYYY-MM-DD format
//    */
//   async getHolidayDatesForYear(year) {
//     const holidays = await this.getHolidaysByYear(year);
//     return holidays.map(h => h.date);
//   }

//   /**
//    * Check if a specific date is a holiday
//    * @param {string} date - Date in YYYY-MM-DD format
//    * @returns {boolean} true if date is a holiday
//    */
//   async isHoliday(date) {
//     try {
//       const year = new Date(date).getFullYear();
//       const holidays = await this.getHolidayDatesForYear(year);
//       return holidays.includes(date);
//     } catch (error) {
//       console.error('Error checking if date is holiday:', error.message);
//       return false;
//     }
//   }

//   /**
//    * Get holiday name for a specific date
//    * @param {string} date - Date in YYYY-MM-DD format
//    * @returns {string|null} Holiday name or null if not a holiday
//    */
//   async getHolidayName(date) {
//     try {
//       const year = new Date(date).getFullYear();
//       const holidays = await this.getHolidaysByYear(year);
//       const holiday = holidays.find(h => h.date === date);
//       return holiday ? holiday.name : null;
//     } catch (error) {
//       console.error('Error getting holiday name:', error.message);
//       return null;
//     }
//   }

//   /**
//    * Add a new holiday to the calendar (requires WRITE access)
//    * @param {string} date - Date in YYYY-MM-DD format
//    * @param {string} name - Holiday name
//    * @param {string} description - Optional description
//    */
//   async addHoliday(date, name, description = '') {
//     try {
//       await this.ensureInitialized();

//       const event = {
//         summary: name,
//         description: description,
//         start: {
//           date: date
//         },
//         end: {
//           date: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0]
//         }
//       };

//       const response = await this.calendar.events.insert({
//         calendarId: this.calendarId,
//         resource: event
//       });

//       console.log(`✓ Holiday added: ${name} on ${date}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding holiday to Google Calendar:', error.message);
//       throw new Error(`Failed to add holiday: ${error.message}`);
//     }
//   }

//   /**
//    * Cache holidays in memory with TTL (to reduce API calls)
//    * Caches for 24 hours
//    */
//   static holidayCache = new Map();
//   static cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

//   /**
//    * Get holidays with caching
//    */
//   async getHolidaysWithCache(year) {
//     const cacheKey = `holidays_${year}`;
//     const cached = GoogleCalendarService.holidayCache.get(cacheKey);

//     if (cached && Date.now() - cached.timestamp < GoogleCalendarService.cacheTTL) {
//       console.log(`✓ Holidays fetched from cache for year ${year}`);
//       return cached.data;
//     }

//     const holidays = await this.getHolidaysByYear(year);
//     GoogleCalendarService.holidayCache.set(cacheKey, {
//       data: holidays,
//       timestamp: Date.now()
//     });

//     console.log(`✓ Holidays cached for year ${year}`);
//     return holidays;
//   }

//   /**
//    * Clear cache for a specific year
//    */
//   static clearCache(year = null) {
//     if (year) {
//       GoogleCalendarService.holidayCache.delete(`holidays_${year}`);
//     } else {
//       GoogleCalendarService.holidayCache.clear();
//     }
//   }
// }

module.exports = new GoogleCalendarService();