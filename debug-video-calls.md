## 🐛 **Video Call Notification Debugging Guide**

### 🔍 **Step-by-Step Debugging Process**

#### **1. Open Browser Console**
- Open **Developer Tools** (F12)
- Go to **Console** tab
- Keep it open while testing

#### **2. Test Call Initiation**
1. **Click video call button** (📹) in chat header
2. **Check console logs** for:
   ```
   Starting video call with: [username]
   Auto-call effect: {isOpen: true, isIncoming: false, ...}
   Triggering auto-call to: [user_id]
   callUser function called with id: [user_id]
   Creating peer and emitting callUser event
   Peer signal generated, emitting callUser to backend
   ```

#### **3. Check Backend Logs**
- In your **server terminal**, look for:
   ```
   Backend received callUser event: {userToCall: "...", signalData: {...}, ...}
   Target user socket: [socket_id]
   Online users: ["user1", "user2"]
   Emitting callUser to target user
   ```

#### **4. Check Receiving Side**
- In **second browser window console**, look for:
   ```
   Incoming call from: [user_id] Type: video
   ```

### 🚨 **Common Issues & Solutions**

#### **❌ Issue 1: "callUser function called" but no peer signal**
**Problem:** Camera/microphone permissions denied
**Solution:** 
- Allow camera/mic permissions
- Check browser settings
- Try `https://` instead of `http://`

#### **❌ Issue 2: Backend not receiving callUser event**
**Problem:** Socket.IO connection issue
**Solution:**
- Check network tab for socket connections
- Verify CORS is working
- Restart both frontend and backend

#### **❌ Issue 3: Target user not found**
**Problem:** User not in online users map
**Solution:**
- Check if both users are properly logged in
- Verify socket connection is established
- Check `global.onlineUsers` in backend logs

#### **❌ Issue 4: No incoming call notification**
**Problem:** Frontend not listening to callUser event
**Solution:**
- Check if ChatContainer is mounted
- Verify socket event listeners are attached
- Check for JavaScript errors

### 🧪 **Quick Tests**

#### **Test 1: Check Socket Connection**
In browser console:
```javascript
// Should show socket object
console.log("Socket:", window.socket);
```

#### **Test 2: Manual Call Test**
In browser console:
```javascript
// Replace with actual user ID
socket.emit("callUser", {
  userToCall: "684e4a7582e0bb1669840957",
  signalData: {},
  from: "test",
  name: "Test User",
  callType: "video"
});
```

#### **Test 3: Check Online Users**
```javascript
fetch('http://localhost:5001/api/users/online')
  .then(r => r.json())
  .then(data => console.log("Online users:", data));
```

### 📋 **Debugging Checklist**

- [ ] Both users are logged in and online
- [ ] Socket.IO connections are established
- [ ] Camera/microphone permissions are granted
- [ ] No JavaScript errors in console
- [ ] CORS is properly configured
- [ ] Backend is receiving callUser events
- [ ] Target user is in online users map
- [ ] Frontend is listening for callUser events

### 🔧 **Next Steps**

1. **Follow the debugging process** above
2. **Share the console logs** you see
3. **Check what's missing** from the expected logs
4. **We'll fix the specific issue** based on the findings

Run through these steps and let me know what you find! 🕵️‍♂️
