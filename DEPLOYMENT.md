# GitHub Pages Deployment Guide

## 🚀 How to Deploy Your Text-to-Audio Converter to GitHub Pages

### Step 1: Update Configuration Files

**Before deploying, you need to update these files with your actual GitHub repository information:**

#### 1. Update `package.json`
Replace `yourusername` and `your-repo-name` in the homepage URL:
```json
"homepage": "https://yourusername.github.io/your-repo-name"
```

#### 2. Update `vite.config.js`
Replace `your-repo-name` with your actual repository name:
```javascript
base: '/your-repo-name/'
```

**Example:**
If your GitHub username is `john-doe` and repository name is `text-audio-converter`, then:
- Homepage: `https://john-doe.github.io/text-audio-converter`
- Base: `/text-audio-converter/`

### Step 2: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Text-to-Audio Converter with dark mode"
   ```

2. **Add your GitHub repository as remote**:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. The deployment will start automatically

### Step 4: Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build and deploy
npm run deploy
```

### Step 5: Access Your Deployed App

After successful deployment, your app will be available at:
```
https://yourusername.github.io/your-repo-name
```

## 🔧 Troubleshooting

### Common Issues:

1. **404 Error**: Check that your `base` path in `vite.config.js` matches your repository name exactly

2. **Assets Not Loading**: Ensure the repository name in both `package.json` and `vite.config.js` are identical

3. **Build Fails**: Make sure all dependencies are properly installed:
   ```bash
   npm install
   npm run build
   ```

4. **GitHub Actions Fails**: Check the Actions tab in your repository for error details

### 🎯 Quick Fix Commands:

If you need to update your configuration:

```bash
# Update package.json homepage
npm pkg set homepage="https://yourusername.github.io/your-repo-name"

# Then commit and push
git add .
git commit -m "Update deployment configuration"
git push
```

## 📱 Features Available on GitHub Pages

✅ **Full Text-to-Speech Functionality**  
✅ **Dark Mode Design**  
✅ **Audio Download (MP3/WAV)**  
✅ **Real TTS Audio Generation**  
✅ **Responsive Design**  
✅ **Voice Selection & Controls**  

## 🌟 Post-Deployment

After successful deployment:

1. Test all features on the live site
2. Share your app URL with others
3. Consider adding the live demo link to your repository README
4. Monitor GitHub Actions for any deployment issues

## 📝 Notes

- Deployment typically takes 2-5 minutes
- GitHub Pages serves static files, so all TTS processing happens client-side
- The app works best in Chrome/Edge browsers due to Web API support
- All external TTS services (like ResponsiveVoice) will work on the deployed version

Happy deploying! 🎉
