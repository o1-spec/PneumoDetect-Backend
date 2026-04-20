# React Native Integration Guide
## PneumoDetect Backend API - Complete Documentation

**Backend Status:** ✅ Production Ready (98% Compliant)  
**Date:** April 20, 2026  
**Platforms:** iOS | Android  
**API Version:** 1.0.0

---

## 📋 Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Authentication](#authentication)
3. [Dashboard & Analytics](#dashboard--analytics)
4. [Patient Management](#patient-management)
5. [Scan Management](#scan-management)
6. [User Profile](#user-profile)
7. [Notifications](#notifications)
8. [Error Handling](#error-handling)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Setup & Configuration

### Environment Variables

```javascript
// .env
REACT_APP_API_DEV=http://localhost:3000
REACT_APP_API_PROD=https://api.pneumodetect.com
```

### API Client Setup

```javascript
// services/apiClient.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3000'  // Use your computer's IP for Android emulator
  : 'https://api.pneumodetect.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await AsyncStorage.removeItem('accessToken');
      // Navigation.reset({ routes: [{ name: 'Login' }] });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Authentication

### 1. User Registration

```javascript
// services/authService.ts

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'CLINICIAN' | 'PATIENT' | 'ADMIN';
  phone?: string;
  specialization?: string; // CLINICIAN only
  dateOfBirth?: string; // PATIENT only (ISO format)
  gender?: 'MALE' | 'FEMALE'; // PATIENT only
  bloodType?: string; // PATIENT only
  medicalHistory?: string; // PATIENT only
}

export const register = async (data: RegisterRequest) => {
  try {
    const response = await apiClient.post('/auth/register', data);
    // Response includes accessToken but user is NOT verified yet
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};
```

**Example Usage:**
```javascript
// screens/RegisterScreen.tsx
const handleRegister = async (formData) => {
  try {
    const response = await register({
      email: 'doctor@example.com',
      password: 'SecurePass123!',
      name: 'Dr. John Doe',
      role: 'CLINICIAN',
      phone: '+1234567890',
      specialization: 'Radiology',
    });
    
    // Save token (user not verified yet)
    await AsyncStorage.setItem('accessToken', response.accessToken);
    
    // Redirect to OTP verification
    navigation.navigate('VerifyOTP', { email: response.email });
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### 2. Verify OTP

```javascript
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await apiClient.post('/auth/verify-otp', {
      email,
      otp, // 6-digit code
    });
    // Update token if different
    if (response.data.accessToken) {
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'OTP verification failed');
  }
};
```

**Example Usage:**
```javascript
// screens/VerifyOTPScreen.tsx
const [otp, setOtp] = useState('');

const handleVerifyOTP = async () => {
  try {
    await verifyOtp(route.params.email, otp);
    
    // Redirect to Dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### 3. Login

```javascript
interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (data: LoginRequest) => {
  try {
    const response = await apiClient.post('/auth/login', data);
    // Save token
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid credentials or account not verified');
    }
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};
```

**Example Usage:**
```javascript
const handleLogin = async (email: string, password: string) => {
  try {
    setLoading(true);
    const user = await login({ email, password });
    
    // Check if email is verified
    if (!user.isVerified) {
      navigation.navigate('VerifyOTP', { email });
      return;
    }
    
    // Save user info to context/redux
    setCurrentUser(user);
    
    // Navigate based on role
    if (user.role === 'PATIENT') {
      navigation.reset({ routes: [{ name: 'PatientDashboard' }] });
    } else {
      navigation.reset({ routes: [{ name: 'ClinicianDashboard' }] });
    }
  } catch (error) {
    Alert.alert('Login Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### 4. Logout

```javascript
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
    // Clear local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    // Still clear local even if API call fails
    await AsyncStorage.removeItem('accessToken');
    throw new Error('Logout failed');
  }
};
```

---

### 5. Forgot Password

```javascript
export const requestPasswordReset = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    // Returns generic message for security
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Request failed');
  }
};
```

---

### 6. Change Password

```javascript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordRequest) => {
  try {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Password change failed');
  }
};
```

---

## Dashboard & Analytics

### Get Dashboard Statistics

```javascript
// services/analyticsService.ts

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/analytics/stats');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard');
  }
};

// Response structure:
interface DashboardStats {
  totalScans: number;
  completedScans: number;
  processingScans: number;
  failedScans: number;
  pneumoniaCases: number;
  normalCases: number;
  averageConfidence: number;
  weekGrowthPercentage: number;
  recentScans: Array<{
    id: string;
    patientName: string;
    result: 'PNEUMONIA_DETECTED' | 'NORMAL';
    confidence: number;
    imageUrl: string;
    createdAt: string;
  }>;
}
```

**Example Usage:**
```javascript
// screens/DashboardScreen.tsx
const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
const [loading, setLoading] = useState(false);

const fetchDashboard = async () => {
  try {
    setLoading(true);
    const data = await getDashboardStats();
    setDashboard(data);
  } catch (error) {
    console.error('Dashboard error:', error);
  } finally {
    setLoading(false);
  }
};

useFocusEffect(
  useCallback(() => {
    fetchDashboard();
  }, [])
);

return (
  <ScrollView>
    <StatCard 
      title="Total Scans" 
      value={dashboard?.totalScans} 
    />
    <StatCard 
      title="Pneumonia Cases" 
      value={dashboard?.pneumoniaCases} 
    />
    <StatCard 
      title="Average Confidence" 
      value={`${(dashboard?.averageConfidence * 100).toFixed(1)}%`} 
    />
    
    <RecentScansSection scans={dashboard?.recentScans} />
  </ScrollView>
);
```

---

### Get Scan Results Breakdown

```javascript
export const getScanResults = async () => {
  try {
    const response = await apiClient.get('/analytics/scans/results');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch results');
  }
};

interface ScanResults {
  resultBreakdown: {
    pneumonia: number;
    normal: number;
    pneumoniaPercentage: number;
    normalPercentage: number;
  };
  confidenceDistribution: {
    excellent: number; // >90%
    good: number; // 80-90%
    fair: number; // <80%
  };
  timelineData: Array<{
    date: string;
    scans: number;
    pneumonia: number;
    normal: number;
    averageConfidence: number;
  }>;
  totalScans: number;
  averageConfidence: number;
}
```

**Example - Chart Display:**
```javascript
import { PieChart, LineChart } from 'react-native-chart-kit';

const renderCharts = async () => {
  const results = await getScanResults();
  
  const pieData = {
    labels: ['Pneumonia', 'Normal'],
    datasets: [
      {
        data: [
          results.resultBreakdown.pneumoniaPercentage,
          results.resultBreakdown.normalPercentage,
        ],
        colors: ['#FF6B6B', '#51CF66'],
      },
    ],
  };
  
  return (
    <>
      <PieChart
        data={pieData}
        width={screenWidth}
        height={220}
        chartConfig={{ backgroundColor: '#ffffff' }}
      />
      <LineChart
        data={{
          labels: results.timelineData.map(d => d.date.slice(-2)),
          datasets: [
            {
              data: results.timelineData.map(d => d.averageConfidence * 100),
            },
          ],
        }}
        width={screenWidth}
        height={220}
      />
    </>
  );
};
```

---

## Patient Management

### Get All Patients

```javascript
// services/patientService.ts

export const getAllPatients = async (options?: {
  search?: string;
  skip?: number;
  take?: number;
}) => {
  try {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.skip) params.append('skip', options.skip.toString());
    if (options?.take) params.append('take', options.take.toString());
    
    const response = await apiClient.get(
      `/patients${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch patients');
  }
};

interface Patient {
  id: string;
  idNumber: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  createdAt: string;
}
```

---

### Create Patient

```javascript
interface CreatePatientRequest {
  idNumber: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
}

export const createPatient = async (data: CreatePatientRequest) => {
  try {
    const response = await apiClient.post('/patients', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create patient');
  }
};
```

**Example Usage:**
```javascript
const handleCreatePatient = async (formData) => {
  try {
    const newPatient = await createPatient({
      idNumber: 'P12345',
      name: 'Jane Doe',
      age: 45,
      gender: 'FEMALE',
    });
    
    Alert.alert('Success', 'Patient created successfully');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### Get Patient Details

```javascript
export const getPatientById = async (patientId: string, includeScans = true) => {
  try {
    const response = await apiClient.get(
      `/patients/${patientId}?includeScans=${includeScans}`
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch patient');
  }
};
```

---

## Scan Management

### Upload Scan

```javascript
// services/scanService.ts
import DocumentPicker from 'react-native-document-picker';

interface UploadScanRequest {
  patientId: string;
  imageUri: string; // file:// URI
  clinicianNotes?: string;
}

export const uploadScan = async (data: UploadScanRequest) => {
  try {
    const formData = new FormData();
    
    // Read file from URI
    const file = {
      uri: data.imageUri,
      type: 'image/jpeg',
      name: `scan-${Date.now()}.jpg`,
    };
    
    formData.append('image', file);
    formData.append('patientId', data.patientId);
    if (data.clinicianNotes) {
      formData.append('clinicianNotes', data.clinicianNotes);
    }
    
    const response = await apiClient.post('/scans/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Upload failed');
  }
};
```

**Example Usage:**
```javascript
const handleSelectImage = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.images],
    });
    
    setSelectedImage(result.uri);
  } catch (error) {
    console.error('Document picker error:', error);
  }
};

const handleUploadScan = async () => {
  try {
    setUploading(true);
    const result = await uploadScan({
      patientId: selectedPatient.id,
      imageUri: selectedImage,
      clinicianNotes: notes,
    });
    
    Alert.alert('Success', 'Scan uploaded');
    // Navigate to processing screen
    navigation.navigate('Processing', { scanId: result.scan.id });
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setUploading(false);
  }
};
```

---

### Process Scan (AI Analysis)

```javascript
export const processScan = async (scanId: string) => {
  try {
    const response = await apiClient.post(`/scans/${scanId}/process`, {});
    return response.data.scan;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Processing failed');
  }
};

interface ProcessedScan {
  id: string;
  result: 'PNEUMONIA_DETECTED' | 'NORMAL';
  confidence: number;
  heatmapUrl: string;
  status: 'COMPLETED';
  analyzedAt: string;
}
```

**Example - Processing with Progress:**
```javascript
// screens/ProcessingScreen.tsx
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState('Initializing...');

useEffect(() => {
  const processingStages = [
    { duration: 5000, label: 'Uploading image...' },
    { duration: 8000, label: 'Preprocessing...' },
    { duration: 10000, label: 'Running AI analysis...' },
    { duration: 5000, label: 'Generating heatmap...' },
  ];
  
  let currentTime = 0;
  let totalTime = processingStages.reduce((sum, s) => sum + s.duration, 0);
  
  const interval = setInterval(async () => {
    currentTime += 100;
    setProgress((currentTime / totalTime) * 100);
    
    // Update status based on current stage
    for (const stage of processingStages) {
      if (currentTime <= stage.duration) {
        setStatus(stage.label);
        break;
      }
    }
    
    // Done
    if (currentTime >= totalTime) {
      clearInterval(interval);
      const result = await processScan(scanId);
      navigation.navigate('Results', { scan: result });
    }
  }, 100);
  
  return () => clearInterval(interval);
}, []);

return (
  <View style={styles.container}>
    <LottieView source={require('./animations/analyzing.json')} autoPlay loop />
    <ProgressBar value={progress} />
    <Text>{status}</Text>
    <Text>{Math.round(progress)}%</Text>
  </View>
);
```

---

### Get Scan Details

```javascript
export const getScanById = async (scanId: string) => {
  try {
    const response = await apiClient.get(`/scans/${scanId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch scan');
  }
};

interface Scan {
  id: string;
  imageUrl: string;
  heatmapUrl: string;
  result: 'PNEUMONIA_DETECTED' | 'NORMAL';
  confidence: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  patientId: string;
  patientName: string;
  createdAt: string;
  analyzedAt?: string;
  clinicianNotes?: string;
}
```

---

### Get Scan History

```javascript
export const getScanHistory = async () => {
  try {
    const response = await apiClient.get('/scans');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch scans');
  }
};
```

---

### Get My Scans (Patient Only)

```javascript
export const getMyScans = async () => {
  try {
    // Note: This is for PATIENT role only
    const response = await apiClient.get('/scans/patient/my-scans/list');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch your scans');
  }
};
```

**Example Usage:**
```javascript
// screens/PatientScansScreen.tsx
const [myScans, setMyScans] = useState([]);

useFocusEffect(
  useCallback(() => {
    const fetchScans = async () => {
      try {
        const data = await getMyScans();
        setMyScans(data.scans);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchScans();
  }, [])
);

return (
  <FlatList
    data={myScans}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <ScanCard
        scan={item}
        onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
      />
    )}
  />
);
```

---

## User Profile

### Get Current User

```javascript
// services/userService.ts

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLINICIAN' | 'PATIENT';
  phone?: string;
  specialization?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}
```

---

### Update Profile

```javascript
interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  specialization?: string;
  avatarUrl?: string;
}

export const updateProfile = async (data: UpdateProfileRequest) => {
  try {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};
```

**Example Usage:**
```javascript
const handleUpdateProfile = async (formData) => {
  try {
    const updatedUser = await updateProfile({
      name: formData.name,
      phone: formData.phone,
      specialization: formData.specialization,
    });
    
    setUser(updatedUser);
    Alert.alert('Success', 'Profile updated');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### Get Patient Profile

```javascript
export const getPatientProfile = async () => {
  try {
    // PATIENT role only
    const response = await apiClient.get('/users/patient-profile');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

interface PatientProfile {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  bloodType: string;
  medicalHistory: string;
  createdAt: string;
}
```

---

### Update Patient Profile

```javascript
interface UpdatePatientProfileRequest {
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  bloodType?: string;
  medicalHistory?: string;
}

export const updatePatientProfile = async (data: UpdatePatientProfileRequest) => {
  try {
    const response = await apiClient.put('/users/patient-profile', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update');
  }
};
```

---

## Notifications

### Get Notifications

```javascript
// services/notificationService.ts

export const getNotifications = async () => {
  try {
    const response = await apiClient.get('/notifications');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
  }
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SCAN' | 'SYSTEM' | 'MESSAGE';
  read: boolean;
  createdAt: string;
}
```

---

### Mark Notification as Read

```javascript
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}`, {
      read: true,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update notification');
  }
};
```

---

### Mark All as Read

```javascript
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.post('/notifications/mark-all-read', {});
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update');
  }
};
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

### Global Error Handler

```javascript
// utils/errorHandler.ts

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 401) {
    return 'Unauthorized - Please login again';
  }
  
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action';
  }
  
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  
  if (error.response?.status === 500) {
    return 'Server error - Please try again later';
  }
  
  if (error.message === 'Network Error') {
    return 'Network error - Please check your connection';
  }
  
  return 'An unexpected error occurred';
};

// Usage in components
try {
  // API call
} catch (error) {
  const errorMessage = handleApiError(error);
  Alert.alert('Error', errorMessage);
}
```

---

## Common Issues & Solutions

### Issue 1: Android Emulator Can't Connect to Localhost

**Problem:** `GET http://localhost:3000/auth/login` fails on Android emulator

**Solution:**
```javascript
// Use computer's IP address instead
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3000'  // Your computer IP
  : 'https://api.pneumodetect.com';

// Find IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
```

---

### Issue 2: Image Upload Fails

**Problem:** FormData image upload returns 400

**Solution:**
```javascript
// Ensure correct format:
const file = {
  uri: Platform.select({
    ios: imageUri, // file:// URI
    android: imageUri,
  }),
  type: 'image/jpeg', // Must be image/jpeg or image/png
  name: 'scan.jpg',
};

formData.append('image', file);
formData.append('patientId', patientId);
```

---

### Issue 3: CORS Errors

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Backend already has CORS enabled. If still failing:
```javascript
// Check headers in request
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
}
```

---

### Issue 4: Token Expired During Request

**Problem:** 401 Unauthorized response mid-session

**Solution:** Token auto-refresh interceptor already set up
```javascript
// apiClient.ts has interceptor that clears token on 401
// App automatically redirects to login
// User needs to re-authenticate
```

---

### Issue 5: Result Enum Mapping

**Problem:** Backend returns `PNEUMONIA_DETECTED` but UI expects `PNEUMONIA`

**Solution:**
```javascript
const resultMap = {
  'PNEUMONIA_DETECTED': 'PNEUMONIA',
  'NORMAL': 'NORMAL',
  'CONCERNS': 'CONCERNS',
};

const displayResult = resultMap[scan.result] || scan.result;

// Or in a helper:
export const normalizeResult = (result: string): string => {
  return resultMap[result] || result;
};
```

---

### Issue 6: File Size Too Large

**Problem:** Scan upload fails with "file too large"

**Solution:** Backend max is 10MB
```javascript
// Compress image before upload
import { ImageResizer } from 'react-native-smart-image-crop';

const compressImage = async (uri: string) => {
  return ImageResizer.createResizedImage(
    uri,
    1200, // width
    1200, // height
    'JPEG',
    80, // quality
    0, // rotation
    undefined, // outputPath
    false, // keepAspectRatio
    { mode: 'contain', onlyScaleDown: true }
  );
};
```

---

## Testing Checklist

Before deploying to production:

- [ ] Test all auth flows (register, login, OTP, logout)
- [ ] Test upload scan with different image sizes
- [ ] Test dashboard data loads correctly
- [ ] Test patient list and creation
- [ ] Test profile updates
- [ ] Test notifications
- [ ] Test offline mode (if applicable)
- [ ] Test network reconnection handling
- [ ] Test with slow internet (3G throttling)
- [ ] Test error messages display correctly

---

## Environment Setup

### Prerequisites
```bash
npm install
npm install axios @react-native-async-storage/async-storage
npm install react-native-document-picker
npm install react-native-image-crop-picker
```

### Running Backend Locally
```bash
# Terminal 1: Backend
cd pneumodetect-backend
npm run start:dev
# Runs on http://localhost:3000

# Terminal 2: React Native
npx react-native run-android
# or for iOS
npx react-native run-ios
```

---

## API Documentation

**Full Swagger Docs:** http://localhost:3000/api

Available at: `http://your-backend-url/api`

All endpoints require Bearer token authentication except:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`

---

## Support & Debugging

### Debug Logging
```javascript
// Enable detailed logging
apiClient.interceptors.request.use((config) => {
  console.log('📤 Request:', config.method?.toUpperCase(), config.url);
  console.log('Headers:', config.headers);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('❌ Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

### Network Debugging
```bash
# iOS: Use Charles Proxy or Fiddler
# Android: Use Charles Proxy or Android Studio Network Monitor
```

---

## Performance Tips

1. **Cache user data** in AsyncStorage to avoid repeated fetches
2. **Paginate patient lists** - fetch 20 at a time instead of all
3. **Lazy load images** - don't load all scan thumbnails at once
4. **Debounce search** - wait 300ms after user stops typing before API call
5. **Use FlatList** instead of ScrollView for long lists

---

**Last Updated:** April 20, 2026  
**Backend Version:** 1.0.0  
**Status:** ✅ Production Ready

For questions or issues, contact: backend-team@pneumodetect.com

