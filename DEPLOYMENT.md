# Free Hosting Deployment Guide for AegisFlow

## Option 1: Render.com (Recommended)

### Step 1: Prepare Repository

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add production deployment files"
   git push origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

### Step 2: Deploy Backend

1. **Create New Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `backend` folder as root directory
   - Use these settings:
     ```
     Name: aegisflow-backend
     Environment: Python 3
     Build Command: pip install -r requirements.txt
     Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

2. **Add Environment Variables**
   - Go to Service → "Environment"
   - Add: `GROQ_API_KEY` (your actual key)
   - Add: `PYTHON_VERSION` = `3.11.0`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Note your backend URL: `https://aegisflow-backend.onrender.com`

### Step 3: Deploy Frontend

1. **Create New Static Site**
   - Dashboard → "New +" → "Static Site"
   - Connect same repository
   - Select `frontend` folder as root directory
   - Use these settings:
     ```
     Name: aegisflow-frontend
     Build Command: npm run build
     Publish Directory: dist
     ```

2. **Add Environment Variables**
   - Add: `VITE_API_BASE` = `https://aegisflow-backend.onrender.com`

3. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment (1-2 minutes)

### Step 4: Test Your App

1. **Visit your frontend URL**
   - Should be: `https://aegisflow-frontend.onrender.com`

2. **Test functionality**
   - Click "Run agent dispatch"
   - Verify map loads and agents work

## Option 2: Vercel + Railway

### Frontend on Vercel
1. Sign up at [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_BASE`
5. Deploy

### Backend on Railway
1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository, set root to `backend`
4. Add `GROQ_API_KEY` to environment variables
5. Deploy

## Option 3: Netlify + PythonAnywhere

### Frontend on Netlify
1. Sign up at [netlify.com](https://netlify.com)
2. Drag & drop `frontend/dist` folder
3. Set environment variables in Netlify dashboard

### Backend on PythonAnywhere
1. Sign up at [pythonanywhere.com](https://pythonanywhere.com)
2. Upload `backend` files
3. Install requirements
4. Set environment variables
5. Run web app

## Important Notes

### Free Tier Limitations
- **Render**: 750 hours/month, sleeps after 15min inactivity
- **Vercel**: 100GB bandwidth/month
- **Railway**: $5 credit, then sleeps after inactivity
- **Netlify**: 100GB bandwidth/month

### Environment Variables Security
- Never commit API keys to Git
- Use platform's environment variable management
- Your `.env` files are already in `.gitignore`

### Database Considerations
- Your SQLite database will be reset on each deployment
- For persistent data, consider:
  - Render PostgreSQL (free tier)
  - Supabase (free tier)
  - Railway PostgreSQL

### Performance Tips
1. **Frontend**: Enable gzip compression
2. **Backend**: Add response caching
3. **API**: Implement rate limiting
4. **Assets**: Use CDN for static files

## Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version in environment variables
- Verify all requirements are installed
- Check logs in Render dashboard

**Frontend can't reach backend**
- Verify CORS settings in `main.py`
- Check `VITE_API_BASE` environment variable
- Ensure backend is deployed first

**Map not loading**
- Check Leaflet CSS imports
- Verify OpenStreetMap tiles are accessible
- Check browser console for errors

**Agents not working**
- Verify `GROQ_API_KEY` is set correctly
- Check API rate limits
- Review agent logs in backend

### Getting Help

1. **Render Documentation**: https://render.com/docs
2. **Vercel Documentation**: https://vercel.com/docs
3. **GitHub Issues**: Check your repository logs
4. **Community Forums**: Stack Overflow, Reddit r/webdev

## Next Steps

1. **Custom Domain**: Add custom domain on free tier
2. **Analytics**: Add Google Analytics or Plausible
3. **Monitoring**: Set up uptime monitoring
4. **Backup**: Regular database backups
5. **Scaling**: Upgrade plans as needed

Your AegisFlow disaster response system will be live and accessible to judges worldwide!
