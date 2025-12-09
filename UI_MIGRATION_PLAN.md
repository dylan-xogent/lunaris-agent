# Lunaris Agent Platform - UI Migration Plan
## Phase 1.5: UI Evolution & Modernization

> **Target Repository**: https://github.com/dylan-xogent/lunaris-evolve.git
> **Current Stack**: Next.js 14 + React Query + Tailwind
> **Target Stack**: Vite + React 18 + React Query + Recharts + Framer Motion
> **Migration Date**: December 2025
> **Estimated Duration**: 2-3 weeks

---

## 📊 Executive Summary

The lunaris-evolve repository contains a significantly more polished and feature-rich UI compared to our current Next.js implementation. This migration will bring:

- **Enhanced visualizations** with animated stat cards and interactive charts
- **Better UX** with smooth animations and transitions (framer-motion)
- **Faster development** with Vite's instant hot module replacement
- **Modern component library** with full shadcn-ui integration
- **Improved accessibility** and mobile responsiveness
- **Advanced features** like grid/list view toggles, activity feeds, and system health visualizations

---

## 🔍 Architecture Comparison

### Current Architecture (Lunaris-Agent/apps/web)
```
Next.js 14 (App Router)
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx (Dashboard)
│   │   ├── devices/page.tsx
│   │   ├── devices/[id]/page.tsx
│   │   ├── groups/page.tsx
│   │   ├── tags/page.tsx
│   │   └── updates/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/ (basic shadcn-ui)
│   ├── devices/
│   ├── groups/
│   └── tags/
└── lib/
    ├── api.ts (API client)
    └── types.ts
```

### Target Architecture (lunaris-evolve)
```
Vite + React Router
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Devices.tsx
│   │   ├── DeviceDetails.tsx
│   │   ├── Groups.tsx
│   │   ├── Tags.tsx
│   │   ├── Updates.tsx
│   │   ├── Activity.tsx (NEW)
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AnimatedStatCard.tsx
│   │   │   ├── SystemMetricsChart.tsx
│   │   │   ├── DeviceStatusChart.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── DeviceGrid.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── ui/ (full shadcn-ui library - 50+ components)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/
│       └── utils.ts
└── App.tsx (React Router setup)
```

---

## 🎯 Migration Strategy

### Option 1: Full Replacement (Recommended)
**Pros:**
- Clean slate with optimized build system
- No legacy code or architectural debt
- Faster development experience with Vite
- All new features and animations from day one

**Cons:**
- More upfront work
- Need to migrate all API integrations
- Requires Docker configuration updates

**Timeline:** 2-3 weeks

### Option 2: Incremental Migration
**Pros:**
- Lower risk, gradual transition
- Can keep existing pages working during migration
- Easier rollback if issues arise

**Cons:**
- Maintaining two systems simultaneously
- Complex setup with both Next.js and Vite
- Longer overall timeline
- Potential for inconsistent UX

**Timeline:** 3-4 weeks

**Decision: Option 1 (Full Replacement)** ✅
- Current UI is early-stage, minimal risk
- Faster time to market with evolved features
- Simpler architecture going forward

---

## 📦 Key Dependencies Comparison

### Already Compatible (No Changes)
| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| @tanstack/react-query | 5.x | 5.83.0 | ✅ Same library |
| react | 18.x | 18.3.1 | ✅ Compatible |
| react-dom | 18.x | 18.3.1 | ✅ Compatible |
| lucide-react | Latest | 0.462.0 | ✅ Same icons |
| tailwindcss | 3.x | 3.4.17 | ✅ Compatible |
| @radix-ui/* | Partial | Full suite | ⚠️ Expand usage |

### New Dependencies (Add)
| Package | Version | Purpose | Size Impact |
|---------|---------|---------|-------------|
| **framer-motion** | 12.23.25 | Animations & transitions | ~60KB gzipped |
| **recharts** | 2.15.4 | Charts & data visualization | ~150KB gzipped |
| **sonner** | 1.7.4 | Toast notifications | ~5KB gzipped |
| **react-router-dom** | 6.30.1 | Client-side routing | ~20KB gzipped |
| **next-themes** | 0.3.0 | Theme switching | ~3KB gzipped |
| **vite** | 5.4.19 | Build tool | Dev only |
| **date-fns** | 3.6.0 | Date utilities | ~20KB gzipped |
| **react-hook-form** | 7.61.1 | Form management | ~15KB gzipped |
| **zod** | 3.25.76 | Schema validation | ~15KB gzipped |

**Total New Bundle Size:** ~290KB gzipped (acceptable for feature gain)

### Dependencies to Remove
| Package | Current | Reason |
|---------|---------|--------|
| next | 14.x | Replaced by Vite |
| @next/* packages | Various | Not needed with Vite |

---

## 🚀 Enhanced Components Analysis

### 1. AnimatedStatCard
**Location:** `src/components/dashboard/AnimatedStatCard.tsx`

**Features:**
- Animated number counting with spring physics
- Multiple variant styles (primary, success, warning, danger, accent)
- Trend indicators (↑/↓) with percentage
- Hover lift effect
- Staggered entrance animations
- Gradient text effects
- Decorative blur backgrounds

**Props:**
```typescript
interface AnimatedStatCardProps {
  title: string;
  value: number;
  suffix?: string;          // e.g., "%" or "ms"
  subtitle: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "primary" | "success" | "warning" | "danger" | "accent";
  delay?: number;           // For staggered animations
}
```

**Integration Needed:**
- Connect to real-time device stats from API
- WebSocket updates for live number animations

---

### 2. SystemMetricsChart
**Location:** `src/components/dashboard/SystemMetricsChart.tsx`

**Features:**
- Recharts AreaChart with gradients
- CPU and Memory time-series data
- Custom tooltip with glass effect
- Responsive container
- Smooth animations on mount
- Color-coded legend

**Data Structure:**
```typescript
{
  time: string;      // "00:00", "04:00", etc.
  cpu: number;       // 0-100
  memory: number;    // 0-100
}
```

**Integration Needed:**
- Fetch historical metrics from API (new endpoint needed)
- Real-time updates via WebSocket
- Time range selector (1h, 24h, 7d, 30d)
- Device filtering (show specific device or aggregate)

---

### 3. DeviceStatusChart
**Location:** `src/components/dashboard/DeviceStatusChart.tsx`

**Features:**
- Pie/Donut chart of device status distribution
- Interactive legend
- Animated segments
- Status counts

**Integration Needed:**
- Calculate from device list API
- Real-time updates when device status changes

---

### 4. ActivityFeed
**Location:** `src/components/dashboard/ActivityFeed.tsx`

**Features:**
- Real-time event timeline
- Event type icons and colors
- Relative timestamps
- Infinite scroll or pagination
- Filter by event type

**Integration Needed:**
- New backend endpoint: `GET /api/events` or `GET /api/activity`
- WebSocket for real-time events
- Event types: device_enrolled, device_offline, update_installed, etc.

---

### 5. DeviceGrid
**Location:** `src/components/dashboard/DeviceGrid.tsx`

**Features:**
- Card-based device display
- Device status indicators
- Quick actions on hover
- Responsive grid layout
- Staggered entrance animations

**Integration Needed:**
- Same device API, different presentation
- Click to navigate to device details

---

### 6. QuickActions
**Location:** `src/components/dashboard/QuickActions.tsx`

**Features:**
- Common action buttons
- Icon-based interface
- Hover effects
- Configurable actions

**Integration Needed:**
- Action handlers for common operations:
  - Add device
  - Run update scan
  - Create group
  - Create tag
  - View reports

---

## 🔌 API Integration Requirements

### Current API Client (Keep)
**Location:** `apps/web/lib/api.ts`

All existing API functions remain:
- `devices.getAll()`
- `devices.getById(id)`
- `devices.getUpdates(id)`
- `groups.getAll()`, `groups.create()`, etc.
- `tags.getAll()`, `tags.create()`, etc.
- `bulk.addToGroup()`, `bulk.addTags()`, etc.

### New API Endpoints Needed

#### 1. Historical Metrics
```typescript
GET /api/devices/:id/metrics?range=1h|24h|7d|30d
Response: {
  metrics: [
    { timestamp: ISO8601, cpu: number, memory: number, disk: number }
  ]
}
```

#### 2. Activity/Events Feed
```typescript
GET /api/events?limit=50&offset=0&type=all|device|update|group
Response: {
  events: [
    {
      id: string,
      type: "device_enrolled" | "device_offline" | "update_installed" | etc.,
      deviceId: string,
      deviceName: string,
      timestamp: ISO8601,
      metadata: object
    }
  ],
  total: number
}
```

#### 3. Fleet Statistics (Enhanced)
```typescript
GET /api/stats/fleet
Response: {
  totalDevices: number,
  onlineDevices: number,
  offlineDevices: number,
  warningDevices: number,  // NEW: Devices with issues
  devicesWithUpdates: number,
  totalPendingUpdates: number,
  avgCpuUsage: number,      // NEW
  avgMemoryUsage: number,   // NEW
  avgDiskUsage: number,     // NEW
  uptime: number,           // NEW: Fleet uptime percentage
  healthScore: number       // NEW: Overall fleet health (0-100)
}
```

### WebSocket Events (Existing)
✅ Already implemented:
- `device_registered`
- `device_status_change`
- `device_updated`

🆕 Need to add:
- `device_metrics_update` (for real-time chart updates)
- `event_created` (for activity feed)

---

## 🎨 Design System & Styling

### Tailwind Configuration
The lunaris-evolve project has custom Tailwind configuration with:

**Custom Colors:**
```javascript
colors: {
  primary: "hsl(175, 85%, 55%)",      // Cyan
  success: "hsl(155, 75%, 50%)",      // Green
  warning: "hsl(45, 95%, 60%)",       // Amber
  destructive: "hsl(0, 75%, 60%)",    // Red
  accent: "hsl(265, 85%, 65%)",       // Purple
  background: "hsl(230, 20%, 7%)",    // Dark blue-gray
  foreground: "hsl(230, 10%, 95%)",   // Off-white
  // ... more theme colors
}
```

**Custom CSS Classes:**
- `.mesh-bg` - Animated mesh background
- `.glass` - Glass morphism effect
- `.stat-card` - Card styling for stats
- `.chart-card` - Card styling for charts
- `.animated-border` - Gradient border animation
- `.btn-glow` - Glowing button effect
- `.btn-ghost` - Ghost button style
- `.gradient-text` - Gradient text effect

**Animations:**
- Custom keyframes for gradients, pulses, and fades
- Smooth transitions
- Spring physics for numbers

---

## 🏗️ Migration Steps (Detailed)

### Week 1: Foundation & Setup

#### Day 1-2: Project Setup
- [ ] Create new `apps/web-v2` directory (or replace `apps/web`)
- [ ] Copy lunaris-evolve codebase into new directory
- [ ] Update `package.json` name and scripts
- [ ] Install dependencies: `npm install`
- [ ] Configure Vite for proxy to backend API
  ```typescript
  // vite.config.ts
  export default defineConfig({
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/socket.io': {
          target: 'http://localhost:3001',
          ws: true
        }
      }
    }
  })
  ```
- [ ] Update Docker configuration
  ```dockerfile
  # Update apps/web/Dockerfile to use Vite
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  CMD ["npm", "run", "preview"]
  ```

#### Day 3: API Integration
- [ ] Copy `apps/web/lib/api.ts` to new project
- [ ] Copy `apps/web/lib/types.ts` to new project
- [ ] Test all existing API calls work with mock data
- [ ] Set up environment variables for API URL
- [ ] Configure CORS if needed

#### Day 4-5: Core Components
- [ ] Test AnimatedStatCard with real device stats
- [ ] Update Dashboard to fetch real data
- [ ] Connect DeviceGrid to API
- [ ] Implement WebSocket for real-time updates
- [ ] Test responsive layouts

### Week 2: Feature Implementation

#### Day 6-7: Enhanced Dashboard
- [ ] Implement SystemMetricsChart backend endpoint
- [ ] Connect SystemMetricsChart to real data
- [ ] Add DeviceStatusChart calculations
- [ ] Test real-time metric updates
- [ ] Add time range selector

#### Day 8-9: Devices Page
- [ ] Update Devices page to use real API data
- [ ] Implement grid/list view toggle
- [ ] Add device filtering and search
- [ ] Connect bulk selection to API
- [ ] Test device navigation

#### Day 10: Groups & Tags
- [ ] Migrate Groups page UI
- [ ] Migrate Tags page UI
- [ ] Connect to existing APIs
- [ ] Test CRUD operations
- [ ] Add animations

### Week 3: Polish & Deployment

#### Day 11-12: Activity Feed & Advanced Features
- [ ] Implement backend events/activity endpoint
- [ ] Build ActivityFeed component integration
- [ ] Add WebSocket listener for real-time events
- [ ] Test event types and formatting

#### Day 13: Settings & Extras
- [ ] Migrate Settings page
- [ ] Add theme switcher
- [ ] Implement 404 page
- [ ] Add loading states

#### Day 14-15: Testing & Optimization
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
  - Lazy load routes
  - Code splitting
  - Image optimization
- [ ] Accessibility audit
- [ ] Bundle size analysis

#### Day 16-17: Deployment & Monitoring
- [ ] Update Docker Compose configuration
- [ ] Build production bundle
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Monitor performance metrics
- [ ] Fix any critical bugs

#### Day 18: Go Live
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Document changes

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **API incompatibility** | High | Low | Thorough testing of all endpoints; maintain backward compatibility |
| **Performance issues** | Medium | Low | Bundle size monitoring; lazy loading; code splitting |
| **WebSocket reconnection** | Medium | Medium | Implement robust reconnection logic with exponential backoff |
| **Missing API endpoints** | High | High | Build new endpoints before UI migration (metrics, events) |
| **Browser compatibility** | Low | Low | Test on all major browsers; use polyfills if needed |
| **Docker config issues** | Medium | Medium | Test Docker builds early; update documentation |
| **Data migration** | Low | Low | No database changes; UI-only migration |
| **User training** | Low | Medium | Create quick start guide; demo video |

---

## 📈 Success Metrics

### Technical Metrics
- [ ] Bundle size < 500KB gzipped (current: ~290KB estimated)
- [ ] Time to Interactive < 2 seconds
- [ ] Lighthouse Performance Score > 90
- [ ] Lighthouse Accessibility Score > 95
- [ ] Zero console errors in production
- [ ] API response times < 200ms (p95)
- [ ] WebSocket reconnection success rate > 99%

### User Experience Metrics
- [ ] All animations run at 60fps
- [ ] No layout shift (CLS < 0.1)
- [ ] Smooth scrolling on all devices
- [ ] Touch targets > 48x48px (mobile)
- [ ] Keyboard navigation works for all actions
- [ ] Screen reader compatible

### Feature Completeness
- [ ] All existing pages migrated
- [ ] All existing features work
- [ ] New features implemented:
  - [ ] AnimatedStatCard
  - [ ] SystemMetricsChart
  - [ ] DeviceStatusChart
  - [ ] ActivityFeed
  - [ ] Grid/List toggle
  - [ ] Quick Actions
  - [ ] Theme switcher
- [ ] Real-time updates via WebSocket
- [ ] Historical data visualization

---

## 🔄 Rollback Plan

If critical issues arise:

1. **Docker Rollback** (5 minutes)
   ```bash
   # Revert to previous image
   docker-compose down
   docker-compose up -d --build apps/web:previous
   ```

2. **Git Rollback** (10 minutes)
   ```bash
   git revert <migration-commit>
   git push origin master
   ```

3. **Database** - No changes needed (UI-only migration)

4. **Communication**
   - Notify users of temporary rollback
   - Post incident report
   - Schedule fix deployment

---

## 📚 Documentation Updates Needed

- [ ] Update README with new tech stack
- [ ] Update ARCHITECTURE.md
- [ ] Create UI_COMPONENTS.md guide
- [ ] Update API documentation
- [ ] Create developer onboarding guide
- [ ] Record demo video
- [ ] Update deployment guide

---

## 🎓 Training & Knowledge Transfer

### Team Training
- [ ] Overview presentation of new architecture
- [ ] Framer Motion animation patterns
- [ ] Recharts usage guide
- [ ] shadcn-ui component library tour
- [ ] React Router patterns
- [ ] WebSocket integration guide

### User Training
- [ ] Quick start guide
- [ ] Video walkthrough of new features
- [ ] FAQ document
- [ ] Feature comparison doc (old vs new)

---

## 🔗 References

### Documentation
- [Vite Documentation](https://vitejs.dev)
- [React Router v6](https://reactrouter.com/en/main)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [shadcn/ui](https://ui.shadcn.com/)

### Code Repositories
- Current: `apps/web` (Next.js)
- Target: `lunaris-evolve` (Vite + React)
- API: `apps/api` (NestJS)

---

## ✅ Pre-Migration Checklist

Before starting migration:

### Backend
- [ ] All current API endpoints are documented
- [ ] WebSocket events are documented
- [ ] New endpoints planned (metrics, events)
- [ ] API health check endpoint exists
- [ ] CORS configured correctly

### Frontend
- [ ] Current feature list documented
- [ ] User flows documented
- [ ] Component inventory complete
- [ ] Design system defined
- [ ] Performance baseline established

### Infrastructure
- [ ] Docker setup tested
- [ ] CI/CD pipeline ready
- [ ] Staging environment available
- [ ] Monitoring tools configured
- [ ] Backup strategy in place

---

## 📅 Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Week 1** | 5 days | Project setup, API integration, core components |
| **Week 2** | 5 days | Enhanced dashboard, devices page, groups/tags |
| **Week 3** | 5 days | Activity feed, testing, deployment |
| **Buffer** | 3 days | Bug fixes, polish, documentation |
| **Total** | 18 days | Production-ready evolved UI |

---

## 🎉 Post-Migration

### Immediate (Week 1)
- Monitor error rates and performance
- Collect user feedback
- Fix critical bugs
- Create FAQ based on support tickets

### Short-term (Month 1)
- Implement user feedback
- Add any missing features
- Performance optimizations
- A/B test new features

### Long-term (Quarter 1)
- Advanced analytics
- Custom dashboards
- Mobile app (if planned)
- Continue Phase 2 roadmap

---

**Migration Lead**: Claude Code
**Last Updated**: December 9, 2025
**Status**: Planning Phase
**Next Review**: Start of Week 1
