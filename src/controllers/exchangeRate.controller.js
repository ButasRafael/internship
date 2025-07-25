import { ExchangeRate } from '../models/exchangeRate.model.js';

export const listRates = async (req, res) => {
    const { day, base, quote } = req.query;
    res.json(await ExchangeRate.findAll({ day, base, quote }));
};

export const getRate = async (req, res) => {
    const { day, base, quote } = req.params;
    const r = await ExchangeRate.find(day, base, quote);
    if (!r) return res.status(404).json({ error: 'Rate not found' });
    res.json(r);
};

export const upsertRate = async (req, res, next) => {
    try {
        const r = await ExchangeRate.upsert(req.body); // { day, base, quote, rate }
        res.status(201).json(r);
    } catch (err) {
        next(err);
    }
};

export const deleteRate = async (req, res, next) => {
    try {
        const { day, base, quote } = req.params;
        await ExchangeRate.remove(day, base, quote);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
