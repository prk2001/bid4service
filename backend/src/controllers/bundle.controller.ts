import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    if (req.user.role !== 'CUSTOMER') { res.status(403).json({ success: false, message: 'Only customers can create bundles' }); return; }
    const { title, description, discountPercent, jobIds } = req.body;
    if (!title || !jobIds || jobIds.length < 2) { res.status(400).json({ success: false, message: 'Bundle requires title and at least 2 jobs' }); return; }
    const jobs = await prisma.job.findMany({ where: { id: { in: jobIds }, customerId: req.user.userId, status: { in: ['OPEN', 'IN_BIDDING'] }, bundleId: null } });
    if (jobs.length !== jobIds.length) { res.status(400).json({ success: false, message: 'Some jobs not available for bundling' }); return; }
    const totalStartingBid = jobs.reduce((sum, job) => sum + job.startingBid, 0);
    const bundle = await prisma.jobBundle.create({ data: { customerId: req.user.userId, title, description, discountPercent: discountPercent || 0, totalStartingBid, jobCount: jobIds.length } });
    await prisma.job.updateMany({ where: { id: { in: jobIds } }, data: { bundleId: bundle.id } });
    const completeBundle = await prisma.jobBundle.findUnique({ where: { id: bundle.id }, include: { jobs: true, customer: { select: { id: true, firstName: true, lastName: true } } } });
    res.status(201).json({ success: true, message: 'Bundle created', data: { bundle: completeBundle } });
  } catch (error) { next(error); }
};

export const getAllBundles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string); const limitNum = parseInt(limit as string); const skip = (pageNum - 1) * limitNum;
    const where: any = { status: status || 'ACTIVE' };
    const [bundles, total] = await Promise.all([
      prisma.jobBundle.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' }, include: { jobs: { select: { id: true, title: true, category: true, startingBid: true, status: true, city: true, state: true } }, customer: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { bundleBids: true } } } }),
      prisma.jobBundle.count({ where })
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
    const bundle = await prisma.jobBundle.findUnique({ where: { id }, include: { jobs: { include: { _count: { select: { bids: true } } } }, customer: { select: { id: true, firstName: true, lastName: true, profileImage: true } }, bundleBids: { include: { provider: { select: { id: true, firstName: true, lastName: true, profileImage: true, providerProfile: { select: { businessName: true, averageRating: true, totalProjectsCompleted: true } } } } }, orderBy: { amount: 'asc' } } } });
    if (!bundle) { res.status(404).json({ success: false, message: 'Bundle not found' }); return; }
    res.status(200).json({ success: true, data: { bundle } });
  } catch (error) { next(error); }
};

export const getMyBundles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    const bundles = await prisma.jobBundle.findMany({ where: { customerId: req.user.userId }, orderBy: { createdAt: 'desc' }, include: { jobs: { select: { id: true, title: true, category: true, startingBid: true, status: true } }, _count: { select: { bundleBids: true } } } });
    res.status(200).json({ success: true, data: { bundles } });
  } catch (error) { next(error); }
};

export const submitBundleBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    if (req.user.role !== 'PROVIDER') { res.status(403).json({ success: false, message: 'Only providers can submit bids' }); return; }
    const { id } = req.params; const { amount, proposal, estimatedDuration } = req.body;
    if (!amount || !proposal) { res.status(400).json({ success: false, message: 'Amount and proposal required' }); return; }
    const bundle = await prisma.jobBundle.findUnique({ where: { id } });
    if (!bundle) { res.status(404).json({ success: false, message: 'Bundle not found' }); return; }
    if (bundle.status !== 'ACTIVE') { res.status(400).json({ success: false, message: 'Bundle not accepting bids' }); return; }
    const existingBid = await prisma.bundleBid.findUnique({ where: { bundleId_providerId: { bundleId: id, providerId: req.user.userId } } });
    if (existingBid) { res.status(400).json({ success: false, message: 'Already bid on this bundle' }); return; }
    const bid = await prisma.bundleBid.create({ data: { bundleId: id, providerId: req.user.userId, amount: parseFloat(amount), proposal, estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null }, include: { provider: { select: { id: true, firstName: true, lastName: true } } } });
    res.status(201).json({ success: true, message: 'Bundle bid submitted', data: { bid } });
  } catch (error) { next(error); }
};

export const acceptBundleBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    const { id, bidId } = req.params;
    const bundle = await prisma.jobBundle.findUnique({ where: { id }, include: { jobs: true } });
    if (!bundle) { res.status(404).json({ success: false, message: 'Bundle not found' }); return; }
    if (bundle.customerId !== req.user.userId) { res.status(403).json({ success: false, message: 'Only bundle owner can accept bids' }); return; }
    const bid = await prisma.bundleBid.findUnique({ where: { id: bidId } });
    if (!bid || bid.bundleId !== id) { res.status(404).json({ success: false, message: 'Bid not found' }); return; }
    if (bid.status !== 'PENDING') { res.status(400).json({ success: false, message: 'Bid no longer available' }); return; }
    await prisma.$transaction(async (tx) => {
      await tx.bundleBid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } });
      await tx.bundleBid.updateMany({ where: { bundleId: id, id: { not: bidId }, status: 'PENDING' }, data: { status: 'REJECTED' } });
      await tx.jobBundle.update({ where: { id }, data: { status: 'ACCEPTED', acceptedBidId: bidId } });
      await tx.job.updateMany({ where: { bundleId: id }, data: { status: 'BID_ACCEPTED' } });
      for (const job of bundle.jobs) { await tx.project.create({ data: { jobId: job.id, customerId: bundle.customerId, providerId: bid.providerId, agreedAmount: bid.amount / bundle.jobs.length, bundleId: id } }); }
    });
    res.status(200).json({ success: true, message: 'Bundle bid accepted. Projects created.' });
  } catch (error) { next(error); }
};

export const deleteBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    const { id } = req.params;
    const bundle = await prisma.jobBundle.findUnique({ where: { id } });
    if (!bundle) { res.status(404).json({ success: false, message: 'Bundle not found' }); return; }
    if (bundle.customerId !== req.user.userId) { res.status(403).json({ success: false, message: 'Only bundle owner can delete' }); return; }
    if (bundle.status === 'ACCEPTED') { res.status(400).json({ success: false, message: 'Cannot delete accepted bundle' }); return; }
    await prisma.job.updateMany({ where: { bundleId: id }, data: { bundleId: null } });
    await prisma.bundleBid.deleteMany({ where: { bundleId: id } });
    await prisma.jobBundle.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Bundle dissolved' });
  } catch (error) { next(error); }
};
