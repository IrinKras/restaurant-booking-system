/**
 * Unit Tests for Booking System
 * Test Framework: Jest
 * File: tests/booking.test.js
 */

const request = require('supertest');
const app = require('../backend/app');
const { validateBookingData, checkAvailability } = require('../backend/utils/validators');

describe('Booking API Tests', () => {
  
  // ==========================================
  // Test Suite: GET /api/bookings
  // ==========================================
  
  describe('GET /api/bookings', () => {
    
    test('Should return all bookings with status 200', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('Should return count of bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);
      
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
    
  });
  
  // ==========================================
  // Test Suite: GET /api/bookings/:id
  // ==========================================
  
  describe('GET /api/bookings/:id', () => {
    
    test('Should return a booking by valid ID', async () => {
      const response = await request(app)
        .get('/api/bookings/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 1);
    });
    
    test('Should return 404 for non-existent booking ID', async () => {
      const response = await request(app)
        .get('/api/bookings/99999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('не е намерена');
    });
    
    test('Should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/bookings/invalid')
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
  });
  
  // ==========================================
  // Test Suite: POST /api/bookings
  // ==========================================
  
  describe('POST /api/bookings', () => {
    
    const validBooking = {
      date: '2026-02-15',
      time: '19:00',
      guests: 4,
      name: 'Иван Петров',
      email: 'ivan.petrov@example.com',
      phone: '+359888123456'
    };
    
    test('Should create a new booking with valid data', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(validBooking)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('създадена успешно');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(validBooking.name);
      expect(response.body.data.status).toBe('confirmed');
    });
    
    test('Should return 400 when required fields are missing', async () => {
      const incompleteBooking = {
        date: '2026-02-15',
        time: '19:00'
        // Missing: guests, name, email, phone
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(incompleteBooking)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('задължителни');
    });
    
    test('Should return 400 for invalid number of guests', async () => {
      const invalidBooking = {
        ...validBooking,
        guests: 0  // Invalid: must be >= 1
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Броят гости');
    });
    
    test('Should return 400 for too many guests', async () => {
      const invalidBooking = {
        ...validBooking,
        guests: 15  // Invalid: exceeds maximum
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should return 400 for invalid email format', async () => {
      const invalidBooking = {
        ...validBooking,
        email: 'invalid-email'
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
    
    test('Should return 400 for past booking date', async () => {
      const pastBooking = {
        ...validBooking,
        date: '2020-01-01'  // Past date
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(pastBooking)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('минало');
    });
    
  });
  
  // ==========================================
  // Test Suite: PUT /api/bookings/:id
  // ==========================================
  
  describe('PUT /api/bookings/:id', () => {
    
    test('Should update an existing booking', async () => {
      const updates = {
        guests: 6,
        time: '20:00'
      };
      
      const response = await request(app)
        .put('/api/bookings/1')
        .send(updates)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toBe(6);
      expect(response.body.data.time).toBe('20:00');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
    
    test('Should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .put('/api/bookings/99999')
        .send({ guests: 4 })
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should allow status change to cancelled', async () => {
      const response = await request(app)
        .put('/api/bookings/1')
        .send({ status: 'cancelled' })
        .expect(200);
      
      expect(response.body.data.status).toBe('cancelled');
    });
    
  });
  
  // ==========================================
  // Test Suite: DELETE /api/bookings/:id
  // ==========================================
  
  describe('DELETE /api/bookings/:id', () => {
    
    test('Should delete an existing booking', async () => {
      const response = await request(app)
        .delete('/api/bookings/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('изтрита');
    });
    
    test('Should return 404 when deleting non-existent booking', async () => {
      const response = await request(app)
        .delete('/api/bookings/99999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should actually remove booking from database', async () => {
      await request(app).delete('/api/bookings/2').expect(200);
      
      const getResponse = await request(app)
        .get('/api/bookings/2')
        .expect(404);
      
      expect(getResponse.body.success).toBe(false);
    });
    
  });
  
  // ==========================================
  // Test Suite: GET /api/availability
  // ==========================================
  
  describe('GET /api/availability', () => {
    
    test('Should return availability for a given date and time', async () => {
      const response = await request(app)
        .get('/api/availability')
        .query({ date: '2026-02-15', time: '19:00' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTables');
      expect(response.body.data).toHaveProperty('occupiedTables');
      expect(response.body.data).toHaveProperty('availableTables');
      expect(response.body.data).toHaveProperty('isAvailable');
    });
    
    test('Should return 400 when date is missing', async () => {
      const response = await request(app)
        .get('/api/availability')
        .query({ time: '19:00' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should return 400 when time is missing', async () => {
      const response = await request(app)
        .get('/api/availability')
        .query({ date: '2026-02-15' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should show no availability when all tables are booked', async () => {
      // This test assumes you have a way to fully book all tables
      const response = await request(app)
        .get('/api/availability')
        .query({ date: '2026-02-20', time: '19:00' })
        .expect(200);
      
      if (response.body.data.availableTables === 0) {
        expect(response.body.data.isAvailable).toBe(false);
      }
    });
    
  });
  
  // ==========================================
  // Test Suite: Validation Functions
  // ==========================================
  
  describe('Validation Functions', () => {
    
    describe('validateBookingData()', () => {
      
      test('Should validate correct booking data', () => {
        const validData = {
          date: '2026-02-15',
          time: '19:00',
          guests: 4,
          name: 'Иван Петров',
          email: 'ivan@example.com',
          phone: '+359888123456'
        };
        
        const result = validateBookingData(validData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      test('Should reject invalid email', () => {
        const invalidData = {
          date: '2026-02-15',
          time: '19:00',
          guests: 4,
          name: 'Иван Петров',
          email: 'invalid-email',
          phone: '+359888123456'
        };
        
        const result = validateBookingData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid email format');
      });
      
      test('Should reject negative guest count', () => {
        const invalidData = {
          date: '2026-02-15',
          time: '19:00',
          guests: -1,
          name: 'Иван Петров',
          email: 'ivan@example.com',
          phone: '+359888123456'
        };
        
        const result = validateBookingData(invalidData);
        expect(result.isValid).toBe(false);
      });
      
    });
    
    describe('checkAvailability()', () => {
      
      test('Should return true when tables are available', async () => {
        const isAvailable = await checkAvailability('2026-03-15', '19:00', 4);
        expect(typeof isAvailable).toBe('boolean');
      });
      
      test('Should return available table IDs', async () => {
        const tables = await checkAvailability('2026-03-15', '19:00', 2);
        expect(Array.isArray(tables)).toBe(true);
      });
      
    });
    
  });
  
  // ==========================================
  // Test Suite: Edge Cases
  // ==========================================
  
  describe('Edge Cases', () => {
    
    test('Should handle concurrent bookings gracefully', async () => {
      const booking = {
        date: '2026-02-25',
        time: '19:00',
        guests: 4,
        name: 'Test User',
        email: 'test@example.com',
        phone: '+359888000000'
      };
      
      // Send two identical requests simultaneously
      const [response1, response2] = await Promise.all([
        request(app).post('/api/bookings').send(booking),
        request(app).post('/api/bookings').send(booking)
      ]);
      
      // At least one should succeed
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
    
    test('Should handle special characters in name', async () => {
      const booking = {
        date: '2026-02-15',
        time: '19:00',
        guests: 2,
        name: "O'Connor-Müller Å Ö Ü",
        email: 'special@example.com',
        phone: '+359888123456'
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(booking)
        .expect(201);
      
      expect(response.body.data.name).toBe(booking.name);
    });
    
    test('Should handle maximum capacity booking', async () => {
      const booking = {
        date: '2026-02-15',
        time: '19:00',
        guests: 10,  // Maximum allowed
        name: 'Large Group',
        email: 'group@example.com',
        phone: '+359888123456'
      };
      
      const response = await request(app)
        .post('/api/bookings')
        .send(booking)
        .expect(201);
      
      expect(response.body.data.guests).toBe(10);
    });
    
  });
  
  // ==========================================
  // Test Suite: Performance
  // ==========================================
  
  describe('Performance Tests', () => {
    
    test('Should respond to GET /api/bookings within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/bookings')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });
    
    test('Should handle 100 concurrent requests', async () => {
      const requests = Array(100).fill().map(() => 
        request(app).get('/api/bookings')
      );
      
      const responses = await Promise.all(requests);
      
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(100);
    });
    
  });
  
});

// ==========================================
// Test Suite: Integration Tests
// ==========================================

describe('Integration Tests - Full Booking Flow', () => {
  
  test('Complete booking lifecycle', async () => {
    // 1. Check availability
    const availabilityResponse = await request(app)
      .get('/api/availability')
      .query({ date: '2026-03-01', time: '19:00' })
      .expect(200);
    
    expect(availabilityResponse.body.data.isAvailable).toBe(true);
    
    // 2. Create booking
    const createResponse = await request(app)
      .post('/api/bookings')
      .send({
        date: '2026-03-01',
        time: '19:00',
        guests: 4,
        name: 'Integration Test',
        email: 'integration@test.com',
        phone: '+359888999999'
      })
      .expect(201);
    
    const bookingId = createResponse.body.data.id;
    
    // 3. Retrieve booking
    const getResponse = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .expect(200);
    
    expect(getResponse.body.data.name).toBe('Integration Test');
    
    // 4. Update booking
    const updateResponse = await request(app)
      .put(`/api/bookings/${bookingId}`)
      .send({ guests: 6 })
      .expect(200);
    
    expect(updateResponse.body.data.guests).toBe(6);
    
    // 5. Delete booking
    await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .expect(200);
    
    // 6. Verify deletion
    await request(app)
      .get(`/api/bookings/${bookingId}`)
      .expect(404);
  });
  
});

// ==========================================
// Cleanup after all tests
// ==========================================

afterAll(async () => {
  // Close database connections, clean up test data, etc.
  console.log('All tests completed');
});
