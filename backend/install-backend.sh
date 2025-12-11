#!/bin/bash

# ============================================
# Bid4Service Bundle Feature - FULLY AUTOMATED
# Just run this script - no copy/paste needed!
# ============================================

set -e  # Exit on any error

echo "🚀 Installing Bundle Feature (Backend)..."
echo ""

# Check directory
if [ ! -f "package.json" ] || [ ! -d "src/controllers" ]; then
    echo "❌ Error: Run this from your bid4service-backend folder"
    exit 1
fi

echo "✅ Found backend directory"

# ============================================
# CREATE CONTROLLER
# ============================================
echo "📝 Creating bundle.controller.ts..."
cat > src/controllers/bundle.controller.ts << 'CONTROLLER_EOF'
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const createBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    if (req.user.role !== 'CUSTOMER') throw new ForbiddenError('Only customers can create bundles');

    const { title, description, discountPercent, jobIds } = req.body;
    if (!title || !jobIds || jobIds.length < 2) throw new BadRequestError('Bundle requires a title and at least 2 jobs');

    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds }, customerId: req.user.userId, status: { in: ['OPEN', 'IN_BIDDING'] }, bundleId: null },
    });
    if (jobs.length !== jobIds.length) throw new BadRequestError('Some jobs are not available for bundling');

    const totalStartingBid = jobs.reduce((sum, job) => sum + job.startingBid, 0);
    const bundle = await prisma.jobBundle.create({
      data: { customerId: req.user.userId, title, description, discountPercent: discountPercent || 0, totalStartingBid, jobCount: jobIds.length },
    });
    await prisma.job.updateMany({ where: { id: { in: jobIds } }, data: { bundleId: bundle.id } });

    const completeBundle = await prisma.jobBundle.findUnique({
      where: { id: bundle.id },
      include: { jobs: true, customer: { select: { id: true, firstName: true, lastName: true } } },
    });

    logger.info(`Bundle created: ${bundle.id} by user ${req.user.userId}`);
    res.status(201).json({ success: true, message: 'Bundle created successfully', data: { bundle: completeBundle } });
  } catch (error) { next(error); }
};

export const getAllBundles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    const where: any = { status: status || 'ACTIVE' };

    const [bundles, total] = await Promise.all([
      prisma.jobBundle.findMany({
        where, skip, take: limitNum, orderBy: { createdAt: 'desc' },
        include: {
          jobs: { select: { id: true, title: true, category: true, startingBid: true, status: true, city: true, state: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { bundleBids: true } },
        },
      }),
      prisma.jobBundle.count({ where }),
    ]);

    const bundlesWithBidRange = await Promise.all(bundles.map(async (bundle) => {
      const bids = await prisma.bundleBid.findMany({ where: { bundleId: bundle.id, status: 'PENDING' }, select: { amount: true } });
      const amounts = bids.map(b => b.amount);
      return { ...bundle, lowestBid: amounts.length > 0 ? Math.min(...amounts) : null, highestBid: amounts.length > 0 ? Math.max(...amounts) : null };
    }));

    res.status(200).json({ success: true, data: { bundles: bundlesWithBidRange, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } } });
  } catch (error) { next(error); }
};

export const getBundleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const bundle = await prisma.jobBundle.findUnique({
      where: { id },
      include: {
        jobs: { include: { _count: { select: { bids: true } } } },
        customer: { select: { id: true, firstName: true, lastName: true, profileImage: true, customerProfile: { select: { averageRating: true, totalJobsPosted: true } } } },
        bundleBids: { include: { provider: { select: { id: true, firstName: true, lastName: true, profileImage: true, providerProfile: { select: { businessName: true, averageRating: true, totalProjectsCompleted: true } } } } }, orderBy: { amount: 'asc' } },
      },
    });
    if (!bundle) throw new NotFoundError('Bundle not found');
    res.status(200).json({ success: true, data: { bundle } });
  } catch (error) { next(error); }
};

export const getMyBundles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    const bundles = await prisma.jobBundle.findMany({
      where: { customerId: req.user.userId }, orderBy: { createdAt: 'desc' },
      include: { jobs: { select: { id: true, title: true, category: true, startingBid: true, status: true } }, _count: { select: { bundleBids: true } } },
    });
    res.status(200).json({ success: true, data: { bundles } });
  } catch (error) { next(error); }
};

export const submitBundleBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    if (req.user.role !== 'PROVIDER') throw new ForbiddenError('Only providers can submit bids');

    const { id } = req.params;
    const { amount, proposal, estimatedDuration } = req.body;
    if (!amount || !proposal) throw new BadRequestError('Amount and proposal are required');

    const bundle = await prisma.jobBundle.findUnique({ where: { id }, include: { jobs: true } });
    if (!bundle) throw new NotFoundError('Bundle not found');
    if (bundle.status !== 'ACTIVE') throw new BadRequestError('Bundle is not accepting bids');

    const existingBid = await prisma.bundleBid.findUnique({ where: { bundleId_providerId: { bundleId: id, providerId: req.user.userId } } });
    if (existingBid) throw new BadRequestError('You have already bid on this bundle');

    const bid = await prisma.bundleBid.create({
      data: { bundleId: id, providerId: req.user.userId, amount: parseFloat(amount), proposal, estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null },
      include: { provider: { select: { id: true, firstName: true, lastName: true } } },
    });

    logger.info(`Bundle bid submitted: ${bid.id} by provider ${req.user.userId}`);
    res.status(201).json({ success: true, message: 'Bundle bid submitted successfully', data: { bid } });
  } catch (error) { next(error); }
};

export const acceptBundleBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    const { id, bidId } = req.params;

    const bundle = await prisma.jobBundle.findUnique({ where: { id }, include: { jobs: true } });
    if (!bundle) throw new NotFoundError('Bundle not found');
    if (bundle.customerId !== req.user.userId) throw new ForbiddenError('Only the bundle owner can accept bids');

    const bid = await prisma.bundleBid.findUnique({ where: { id: bidId } });
    if (!bid || bid.bundleId !== id) throw new NotFoundError('Bid not found');
    if (bid.status !== 'PENDING') throw new BadRequestError('Bid is no longer available');

    await prisma.$transaction(async (tx) => {
      await tx.bundleBid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } });
      await tx.bundleBid.updateMany({ where: { bundleId: id, id: { not: bidId }, status: 'PENDING' }, data: { status: 'REJECTED' } });
      await tx.jobBundle.update({ where: { id }, data: { status: 'ACCEPTED', acceptedBidId: bidId } });
      await tx.job.updateMany({ where: { bundleId: id }, data: { status: 'BID_ACCEPTED' } });
      for (const job of bundle.jobs) {
        await tx.project.create({ data: { jobId: job.id, customerId: bundle.customerId, providerId: bid.providerId, agreedAmount: bid.amount / bundle.jobs.length, bundleId: id } });
      }
    });

    logger.info(`Bundle bid accepted: ${bidId} for bundle ${id}`);
    res.status(200).json({ success: true, message: 'Bundle bid accepted. Projects created for all jobs.' });
  } catch (error) { next(error); }
};

export const removeJobFromBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    const { id, jobId } = req.params;

    const bundle = await prisma.jobBundle.findUnique({ where: { id }, include: { jobs: true } });
    if (!bundle) throw new NotFoundError('Bundle not found');
    if (bundle.customerId !== req.user.userId) throw new ForbiddenError('Only the bundle owner can modify it');
    if (bundle.status !== 'ACTIVE') throw new BadRequestError('Cannot modify accepted bundle');

    await prisma.job.update({ where: { id: jobId }, data: { bundleId: null } });

    if (bundle.jobs.length <= 2) {
      await prisma.job.updateMany({ where: { bundleId: id }, data: { bundleId: null } });
      await prisma.bundleBid.deleteMany({ where: { bundleId: id } });
      await prisma.jobBundle.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Bundle dissolved (less than 2 jobs remaining)' });
      return;
    }

    const remainingJobs = bundle.jobs.filter(j => j.id !== jobId);
    const newTotal = remainingJobs.reduce((sum, job) => sum + job.startingBid, 0);
    await prisma.jobBundle.update({ where: { id }, data: { jobCount: remainingJobs.length, totalStartingBid: newTotal } });

    res.status(200).json({ success: true, message: 'Job removed from bundle' });
  } catch (error) { next(error); }
};

export const deleteBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError('Not authenticated');
    const { id } = req.params;

    const bundle = await prisma.jobBundle.findUnique({ where: { id } });
    if (!bundle) throw new NotFoundError('Bundle not found');
    if (bundle.customerId !== req.user.userId) throw new ForbiddenError('Only the bundle owner can delete it');
    if (bundle.status === 'ACCEPTED') throw new BadRequestError('Cannot delete accepted bundle');

    await prisma.job.updateMany({ where: { bundleId: id }, data: { bundleId: null } });
    await prisma.bundleBid.deleteMany({ where: { bundleId: id } });
    await prisma.jobBundle.delete({ where: { id } });

    logger.info(`Bundle deleted: ${id} by user ${req.user.userId}`);
    res.status(200).json({ success: true, message: 'Bundle dissolved successfully' });
  } catch (error) { next(error); }
};
CONTROLLER_EOF
echo "✅ Created bundle.controller.ts"

# ============================================
# CREATE ROUTES
# ============================================
echo "📝 Creating bundle.routes.ts..."
cat > src/routes/bundle.routes.ts << 'ROUTES_EOF'
import { Router } from 'express';
import { createBundle, getAllBundles, getBundleById, getMyBundles, submitBundleBid, acceptBundleBid, removeJobFromBundle, deleteBundle } from '../controllers/bundle.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('CUSTOMER'), createBundle);
router.get('/my-bundles', authenticate, getMyBundles);
router.delete('/:id', authenticate, authorize('CUSTOMER'), deleteBundle);
router.delete('/:id/jobs/:jobId', authenticate, authorize('CUSTOMER'), removeJobFromBundle);
router.post('/:id/bids/:bidId/accept', authenticate, authorize('CUSTOMER'), acceptBundleBid);
router.post('/:id/bids', authenticate, authorize('PROVIDER'), submitBundleBid);
router.get('/', authenticate, getAllBundles);
router.get('/:id', authenticate, getBundleById);

export default router;
ROUTES_EOF
echo "✅ Created bundle.routes.ts"

# ============================================
# PATCH ROUTES INDEX (auto-add import and route)
# ============================================
echo "📝 Patching src/routes/index.ts..."

ROUTES_INDEX="src/routes/index.ts"

# Check if already patched
if grep -q "bundleRoutes" "$ROUTES_INDEX" 2>/dev/null; then
    echo "⚠️  Bundle routes already in index.ts - skipping"
else
    # Add import after the last import line
    # Find the line number of the last import statement
    LAST_IMPORT_LINE=$(grep -n "^import" "$ROUTES_INDEX" | tail -1 | cut -d: -f1)
    
    if [ -n "$LAST_IMPORT_LINE" ]; then
        # Insert the import after the last import
        sed -i "${LAST_IMPORT_LINE}a import bundleRoutes from './bundle.routes';" "$ROUTES_INDEX"
        echo "✅ Added import statement"
    else
        # No imports found, add at top
        sed -i "1i import bundleRoutes from './bundle.routes';" "$ROUTES_INDEX"
        echo "✅ Added import statement at top"
    fi
    
    # Add the route - find where other router.use calls are and add there
    # Look for a pattern like router.use('/jobs', or router.use('/bids',
    if grep -q "router.use('/jobs'" "$ROUTES_INDEX"; then
        sed -i "/router.use('\/jobs'/a router.use('/bundles', bundleRoutes);" "$ROUTES_INDEX"
        echo "✅ Added bundle route after jobs route"
    elif grep -q "router.use('/bids'" "$ROUTES_INDEX"; then
        sed -i "/router.use('\/bids'/a router.use('/bundles', bundleRoutes);" "$ROUTES_INDEX"
        echo "✅ Added bundle route after bids route"
    else
        # Find export default and add before it
        sed -i "/export default/i router.use('/bundles', bundleRoutes);" "$ROUTES_INDEX"
        echo "✅ Added bundle route before export"
    fi
fi

# ============================================
# PATCH PRISMA SCHEMA
# ============================================
echo "📝 Patching prisma/schema.prisma..."

SCHEMA_FILE="prisma/schema.prisma"

# Check if already patched
if grep -q "JobBundle" "$SCHEMA_FILE" 2>/dev/null; then
    echo "⚠️  Bundle models already in schema - skipping"
else
    # 1. Add BundleStatus enum (after other enums)
    # Find the last enum and add after it
    if grep -q "^enum " "$SCHEMA_FILE"; then
        # Find line number of last closing brace of an enum
        LAST_ENUM_END=$(grep -n "^}" "$SCHEMA_FILE" | while read line; do
            linenum=$(echo $line | cut -d: -f1)
            # Check if this } closes an enum by looking at previous lines
            prev_content=$(sed -n "1,${linenum}p" "$SCHEMA_FILE" | tac | grep -m1 "^enum \|^model ")
            if echo "$prev_content" | grep -q "^enum "; then
                echo $linenum
            fi
        done | tail -1)
        
        if [ -n "$LAST_ENUM_END" ]; then
            sed -i "${LAST_ENUM_END}a\\
\\
enum BundleStatus {\\
  ACTIVE\\
  ACCEPTED\\
  COMPLETED\\
  CANCELLED\\
}" "$SCHEMA_FILE"
            echo "✅ Added BundleStatus enum"
        fi
    else
        # No enums found, add before first model
        sed -i "/^model /i\\
enum BundleStatus {\\
  ACTIVE\\
  ACCEPTED\\
  COMPLETED\\
  CANCELLED\\
}\\
" "$SCHEMA_FILE"
        echo "✅ Added BundleStatus enum before models"
    fi

    # 2. Add bundleId to Job model
    # Find "model Job {" and add the field inside
    if grep -q "model Job {" "$SCHEMA_FILE"; then
        # Find the closing brace of Job model
        JOB_START=$(grep -n "model Job {" "$SCHEMA_FILE" | head -1 | cut -d: -f1)
        if [ -n "$JOB_START" ]; then
            # Add fields before the @@map or closing brace
            # Look for @@map("jobs") or just } after model Job
            sed -i "/model Job {/,/^}/{
                /@@map\|^}/i\\
  bundleId     String?    @db.Uuid\\
  bundle       JobBundle? @relation(fields: [bundleId], references: [id])
            }" "$SCHEMA_FILE" 2>/dev/null || true
            echo "✅ Added bundleId to Job model"
        fi
    fi

    # 3. Add bundleId to Project model
    if grep -q "model Project {" "$SCHEMA_FILE"; then
        sed -i "/model Project {/,/^}/{
            /@@map\|^}/i\\
  bundleId     String?    @db.Uuid\\
  bundle       JobBundle? @relation(fields: [bundleId], references: [id])
        }" "$SCHEMA_FILE" 2>/dev/null || true
        echo "✅ Added bundleId to Project model"
    fi

    # 4. Add relations to User model
    if grep -q "model User {" "$SCHEMA_FILE"; then
        sed -i "/model User {/,/^}/{
            /@@map\|^}/i\\
  jobBundles   JobBundle[] @relation(\"UserBundles\")\\
  bundleBids   BundleBid[] @relation(\"UserBundleBids\")
        }" "$SCHEMA_FILE" 2>/dev/null || true
        echo "✅ Added bundle relations to User model"
    fi

    # 5. Add JobBundle and BundleBid models at end of file
    cat >> "$SCHEMA_FILE" << 'MODELS_EOF'

model JobBundle {
  id                String       @id @default(uuid()) @db.Uuid
  customerId        String       @db.Uuid
  title             String
  description       String?
  discountPercent   Float        @default(0)
  totalStartingBid  Float
  jobCount          Int
  status            BundleStatus @default(ACTIVE)
  acceptedBidId     String?      @db.Uuid
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  customer          User         @relation("UserBundles", fields: [customerId], references: [id])
  jobs              Job[]
  bundleBids        BundleBid[]
  projects          Project[]

  @@map("job_bundles")
}

model BundleBid {
  id                String       @id @default(uuid()) @db.Uuid
  bundleId          String       @db.Uuid
  providerId        String       @db.Uuid
  amount            Float
  proposal          String
  estimatedDuration Int?
  status            BidStatus    @default(PENDING)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  bundle            JobBundle    @relation(fields: [bundleId], references: [id])
  provider          User         @relation("UserBundleBids", fields: [providerId], references: [id])

  @@unique([bundleId, providerId])
  @@map("bundle_bids")
}
MODELS_EOF
    echo "✅ Added JobBundle and BundleBid models"
fi

# ============================================
# RUN PRISMA COMMANDS
# ============================================
echo ""
echo "📦 Running Prisma commands..."
npx prisma generate
echo "✅ Prisma client generated"

npx prisma db push
echo "✅ Database schema pushed"

echo ""
echo "============================================"
echo "✅ BACKEND INSTALLATION COMPLETE!"
echo "============================================"
echo ""
echo "Restart your server: npm run dev"
echo ""
