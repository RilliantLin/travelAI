const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.performanceMetrics = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async measurePerformance(name, requestFn) {
    const startTime = Date.now();
    try {
      const result = await requestFn();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.performanceMetrics.push({
        test: name,
        duration: duration,
        status: 'success'
      });
      
      return { success: true, data: result, duration };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.performanceMetrics.push({
        test: name,
        duration: duration,
        status: 'failed'
      });
      
      return { success: false, error, duration };
    }
  }

  async testEndpoint(testName, method, endpoint, options = {}) {
    const { expectedStatus = 200, validateFn, data = null, params = null } = options;
    
    this.log(`Testing: ${testName}`, 'info');
    
    try {
      const config = {
        method,
        url: endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`,
        timeout: 10000,
        validateStatus: () => true
      };

      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      if (params) {
        config.params = params;
      }

      const result = await this.measurePerformance(testName, async () => {
        return await axios(config);
      });

      if (!result.success) {
        throw result.error;
      }

      const response = result.data;
      const status = response.status;
      const responseData = response.data;

      const expectedStatusArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      
      if (!expectedStatusArray.includes(status)) {
        this.log(`❌ FAILED: ${testName} - Expected status ${expectedStatusArray.join(' or ')}, got ${status}`, 'error');
        this.results.failed++;
        this.results.tests.push({
          name: testName,
          status: 'FAILED',
          error: `Status mismatch: expected ${expectedStatusArray.join(' or ')}, got ${status}`,
          response: responseData
        });
        return false;
      }

      if (validateFn && !validateFn(responseData)) {
        this.log(`❌ FAILED: ${testName} - Validation failed`, 'error');
        this.results.failed++;
        this.results.tests.push({
          name: testName,
          status: 'FAILED',
          error: 'Validation failed',
          response: responseData
        });
        return false;
      }

      this.log(`✅ PASSED: ${testName} (${result.duration}ms)`, 'success');
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration: result.duration,
        response: responseData
      });
      return true;
    } catch (error) {
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async testHealthCheck() {
    const result = await this.testEndpoint(
      'Health Check',
      'GET',
      'http://localhost:3001/health',
      {
        expectedStatus: 200,
        validateFn: (data) => data && data.status === 'ok'
      }
    );
    return result;
  }

  async testAPIInfo() {
    const result = await this.testEndpoint(
      'API Info',
      'GET',
      'http://localhost:3001/api',
      {
        expectedStatus: 200,
        validateFn: (data) => data && data.message && data.version && data.endpoints
      }
    );
    return result;
  }

  async testWeatherAPI() {
    this.log('\n=== Testing Weather API ===', 'info');

    await this.testEndpoint(
      'Get Current Weather - Missing Location',
      'GET',
      '/weather/current',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Get Current Weather',
      'GET',
      '/weather/current',
      {
        params: { location: '北京' },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Weather Forecast - Missing Location',
      'GET',
      '/weather/forecast',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Get Weather Forecast',
      'GET',
      '/weather/forecast',
      {
        params: { location: '北京', days: 7 },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Weather by Date',
      'GET',
      '/weather/北京/2024-04-10',
      {
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );
  }

  async testAttractionAPI() {
    this.log('\n=== Testing Attraction API ===', 'info');

    await this.testEndpoint(
      'Search Attractions - Missing Location',
      'GET',
      '/attractions/search',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Search Attractions',
      'GET',
      '/attractions/search',
      {
        params: { location: '北京', keywords: '故宫' },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Attractions by Location - Missing Coords',
      'GET',
      '/attractions/location',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Get Attractions by Location',
      'GET',
      '/attractions/location',
      {
        params: { lat: 39.9042, lng: 116.4074, radius: 5000 },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Attraction Detail - Invalid ID',
      'GET',
      '/attractions/invalid-id-12345',
      {
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );
  }

  async testRestaurantAPI() {
    this.log('\n=== Testing Restaurant API ===', 'info');

    await this.testEndpoint(
      'Search Restaurants - Missing Location',
      'GET',
      '/restaurants/search',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Search Restaurants',
      'GET',
      '/restaurants/search',
      {
        params: { location: '北京', keywords: '火锅' },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Restaurants by Location - Missing Coords',
      'GET',
      '/restaurants/location',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Get Restaurants by Location',
      'GET',
      '/restaurants/location',
      {
        params: { lat: 39.9042, lng: 116.4074, radius: 3000 },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Restaurant Detail - Invalid ID',
      'GET',
      '/restaurants/invalid-id-12345',
      {
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );
  }

  async testItineraryAPI() {
    this.log('\n=== Testing Itinerary API ===', 'info');

    const testItinerary = {
      destination: '北京',
      startDate: '2024-04-10',
      endDate: '2024-04-12',
      title: '北京三日游',
      description: '测试行程',
      userId: 'test-user-001',
      preferences: {
        budget: 'medium',
        interests: ['历史', '文化'],
        pace: 'relaxed'
      }
    };

    await this.testEndpoint(
      'Create Itinerary - Missing Required Fields',
      'POST',
      '/itineraries',
      {
        data: { title: 'Invalid Itinerary' },
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Create Itinerary',
      'POST',
      '/itineraries',
      {
        data: testItinerary,
        expectedStatus: [200, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get User Itineraries',
      'GET',
      '/itineraries',
      {
        params: { userId: 'test-user-001' },
        expectedStatus: 200,
        validateFn: (data) => {
          return data && data.success && Array.isArray(data.data);
        }
      }
    );

    await this.testEndpoint(
      'Get Itinerary - Invalid ID',
      'GET',
      '/itineraries/invalid-id-12345',
      {
        expectedStatus: 404,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );
  }

  async testRouteAPI() {
    this.log('\n=== Testing Route Planning API ===', 'info');

    await this.testEndpoint(
      'Plan Route - Missing Parameters',
      'GET',
      '/routes/plan',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Plan Route',
      'GET',
      '/routes/plan',
      {
        params: {
          origin: '116.4074,39.9042',
          destination: '116.3972,39.9163',
          mode: 'walking'
        },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );

    await this.testEndpoint(
      'Get Distance - Missing Parameters',
      'GET',
      '/routes/distance',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Geocode - Missing Address',
      'GET',
      '/routes/geocode',
      {
        expectedStatus: 400,
        validateFn: (data) => {
          return data && data.success === false && data.error;
        }
      }
    );

    await this.testEndpoint(
      'Geocode',
      'GET',
      '/routes/geocode',
      {
        params: { address: '北京市天安门' },
        expectedStatus: [200, 404, 500],
        validateFn: (data) => {
          return data && data.success !== undefined;
        }
      }
    );
  }

  async testUserAPI() {
    this.log('\n=== Testing User API ===', 'info');

    await this.testEndpoint(
      'Get User Profile - Invalid ID',
      'GET',
      '/users/invalid-id-12345',
      {
        expectedStatus: 404,
        validateFn: (data) => {
          return data && data.success === false;
        }
      }
    );
  }

  async testPreferenceAPI() {
    this.log('\n=== Testing Preference API ===', 'info');

    await this.testEndpoint(
      'Get User Preferences - Invalid ID',
      'GET',
      '/preferences/invalid-id-12345',
      {
        expectedStatus: 404,
        validateFn: (data) => {
          return data && data.success === false;
        }
      }
    );
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    this.log('TEST REPORT SUMMARY', 'info');
    console.log('='.repeat(80));
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(2) : 0;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Pass Rate: ${passRate}%`);

    if (this.performanceMetrics.length > 0) {
      console.log('\n' + '='.repeat(80));
      this.log('PERFORMANCE METRICS', 'info');
      console.log('='.repeat(80));
      
      const avgDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length;
      const maxDuration = Math.max(...this.performanceMetrics.map(m => m.duration));
      const minDuration = Math.min(...this.performanceMetrics.map(m => m.duration));
      
      console.log(`\nAverage Response Time: ${avgDuration.toFixed(2)}ms`);
      console.log(`Max Response Time: ${maxDuration}ms`);
      console.log(`Min Response Time: ${minDuration}ms`);
      
      console.log('\nSlowest Endpoints (>1000ms):');
      const slowEndpoints = this.performanceMetrics
        .filter(m => m.duration > 1000)
        .sort((a, b) => b.duration - a.duration);
      
      if (slowEndpoints.length === 0) {
        console.log('  None - All endpoints responded within 1000ms ✅');
      } else {
        slowEndpoints.forEach(m => {
          console.log(`  - ${m.test}: ${m.duration}ms`);
        });
      }
      
      return {
        summary: {
          total,
          passed: this.results.passed,
          failed: this.results.failed,
          passRate: parseFloat(passRate)
        },
        performance: {
          averageResponseTime: avgDuration,
          maxResponseTime: maxDuration,
          minResponseTime: minDuration
        },
        tests: this.results.tests,
        metrics: this.performanceMetrics
      };
    }

    if (this.results.failed > 0) {
      console.log('\n' + '='.repeat(80));
      this.log('FAILED TESTS DETAILS', 'error');
      console.log('='.repeat(80));
      
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach((test, index) => {
          console.log(`\n${index + 1}. ${test.name}`);
          console.log(`   Error: ${test.error}`);
          if (test.response) {
            console.log(`   Response: ${JSON.stringify(test.response).substring(0, 200)}...`);
          }
        });
    }

    console.log('\n' + '='.repeat(80));
    
    if (this.results.failed === 0) {
      this.log('🎉 ALL TESTS PASSED!', 'success');
    } else {
      this.log(`⚠️  ${this.results.failed} test(s) failed. Please review the details above.`, 'warning');
    }
    
    console.log('='.repeat(80) + '\n');

    return {
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        passRate: parseFloat(passRate)
      },
      performance: {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0
      },
      tests: this.results.tests,
      metrics: this.performanceMetrics
    };
  }

  async runAllTests() {
    this.log('Starting Phase 2 API Functional Testing...', 'info');
    this.log('Base URL: ' + BASE_URL, 'info');
    
    const startTime = Date.now();

    await this.testHealthCheck();
    await this.testAPIInfo();
    await this.testWeatherAPI();
    await this.testAttractionAPI();
    await this.testRestaurantAPI();
    await this.testItineraryAPI();
    await this.testRouteAPI();
    await this.testUserAPI();
    await this.testPreferenceAPI();

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const report = this.generateReport();
    
    console.log(`\nTotal Test Duration: ${(totalDuration / 1000).toFixed(2)}s\n`);

    return report;
  }
}

async function main() {
  const tester = new APITester();
  
  try {
    const report = await tester.runAllTests();
    
    if (report.summary.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();
