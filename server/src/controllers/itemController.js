import Joi from 'joi';
import { Item } from '../models/Item.js';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().max(200).allow(''),
  reportedBy: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(120),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string().max(200).allow(''),
  reportedBy: Joi.string().hex().length(24)
});

function publicItem(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description,
    category: item.category,
    status: item.status,
    location: item.location,
    reportedBy: item.reportedBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
// GET /api/items

export async function getAllItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: items.map(publicItem) });
  } catch (err) {
    next(err);
  }
}


export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(item) });
  } catch (err) {
    next(err);
  }
}
// TODO: implement per README.md section 3.

// POST /api/items

export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    await item.populate('reportedBy', 'name email');
    res.status(201).json({ item: publicItem(item) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location' });
    }
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: publicItem(doc) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title already exists at this location' });
    }
    next(err);
  }
}
// TODO: implement per README.md section 3.

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
