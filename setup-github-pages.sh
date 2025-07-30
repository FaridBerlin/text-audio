#!/bin/bash

# GitHub Pages Deployment Setup Script
# Run this script to quickly configure your project for GitHub Pages deployment

echo "🚀 GitHub Pages Deployment Setup"
echo "================================="
echo ""

# Get user input for repository details
read -p "Enter your GitHub username: " username
read -p "Enter your repository name: " repo_name

echo ""
echo "📝 Updating configuration files..."

# Update package.json homepage
npm pkg set homepage="https://$username.github.io/$repo_name"
echo "✅ Updated package.json homepage"

# Update vite.config.js base path
sed -i "s|base: '/your-repo-name/',|base: '/$repo_name/',|g" vite.config.js
echo "✅ Updated vite.config.js base path"

# Update README.md links
sed -i "s|https://yourusername.github.io/your-repo-name|https://$username.github.io/$repo_name|g" README.md
echo "✅ Updated README.md demo link"

echo ""
echo "🔧 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Setup complete! Next steps:"
    echo ""
    echo "1. Commit and push your changes:"
    echo "   git add ."
    echo "   git commit -m 'Configure GitHub Pages deployment'"
    echo "   git remote add origin https://github.com/$username/$repo_name.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "2. Enable GitHub Pages in your repository settings:"
    echo "   - Go to: https://github.com/$username/$repo_name/settings/pages"
    echo "   - Select 'GitHub Actions' as source"
    echo ""
    echo "3. Your app will be live at:"
    echo "   https://$username.github.io/$repo_name"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Build failed! Please check for errors and try again."
    exit 1
fi
