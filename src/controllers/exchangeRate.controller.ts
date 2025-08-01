import { Request, Response, NextFunction } from 'express';
import { ExchangeRate } from '../models/exchangeRate.model.js';

export const listRates = async (req: Request, res: Response) => {
    const rows = await ExchangeRate.findAll(req.query);
    res.json(rows);
};

export const getRate = async (req: Request, res: Response) => {
    const { day, base, quote } = req.params;
    const row = await ExchangeRate.find(day, base, quote);
    row ? res.json(row) : res.status(404).json({ error: 'Rate not found' });
};

export const upsertRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await ExchangeRate.upsert(req.body);
        res.status(201).json(row);
    } catch (e) { next(e); }
};

export const deleteRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { day, base, quote } = req.params;
        await ExchangeRate.remove(day, base, quote);
        res.status(204).send();
    } catch (e) { next(e); }
};
