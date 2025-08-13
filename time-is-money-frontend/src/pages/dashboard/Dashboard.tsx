import { Grid, Box, Typography, Paper, Stack, useTheme } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

export default function ImprovedDashboardPage() {
    const theme = useTheme();

    const monthlySpendingRON = 1520.75;
    const recurringCostsRON = 430.0;
    const numberOfExpenses = 17;
    const averageExpenseRON =
        monthlySpendingRON / Math.max(numberOfExpenses, 1);

    const lineSeries = [
        {
            name: 'Total spent',
            data: [900, 1200, 1500, 800, 1300, 1520],
            color: theme.palette.primary.main,
        },
    ];
    const lineXAxis = {
        scaleType: 'point' as const,
        data: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    };

    const barSeries = [
        {
            data: [400, 300, 150, 670],
            color: theme.palette.primary.main,
        },
    ];
    const barXAxis = {
        scaleType: 'band' as const,
        data: ['Food', 'Subscriptions', 'Utilities', 'Leisure'],
    };

    const pieSeries = [
        {
            data: [
                { id: 0, value: 400, label: 'Food' },
                { id: 1, value: 300, label: 'Subscriptions' },
                { id: 2, value: 150, label: 'Utilities' },
                { id: 3, value: 670, label: 'Leisure' },
            ],
            innerRadius: 30,
            paddingAngle: 5,
            cornerRadius: 2,
        },
    ];

    const treeData = [
        {
            itemId: '1',
            label: 'Spending',
            children: [
                { itemId: '2', label: 'Food & Dining' },
                { itemId: '3', label: 'Subscriptions' },
                { itemId: '4', label: 'Utilities' },
                { itemId: '5', label: 'Leisure & Hobbies' },
            ],
        },
    ];

    const renderTree = (nodes: {
        itemId: string;
        label: string;
        children?: any[];
    }) => (
        <TreeItem key={nodes.itemId} itemId={nodes.itemId} label={nodes.label}>
            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    );

    return (
        <Box sx={{ width: '100%' }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Welcome back
                    </Typography>
                    <Typography color="text.secondary">
                        Here’s a detailed view of your time‑to‑money picture.
                    </Typography>
                </Box>

                <Grid container spacing={2} columns={12}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                This month’s spending
                            </Typography>
                            <Typography variant="h5" fontWeight={700}>
                                {monthlySpendingRON.toFixed(2)} RON
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Recurring costs
                            </Typography>
                            <Typography variant="h5" fontWeight={700}>
                                {recurringCostsRON.toFixed(2)} RON
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Number of expenses
                            </Typography>
                            <Typography variant="h5" fontWeight={700}>
                                {numberOfExpenses}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Average expense
                            </Typography>
                            <Typography variant="h5" fontWeight={700}>
                                {averageExpenseRON.toFixed(2)} RON
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={2} columns={12}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Monthly trend
                            </Typography>
                            <LineChart
                                xAxis={[lineXAxis]}
                                series={lineSeries}
                                height={240}
                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                            />
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Category breakdown
                            </Typography>
                            <BarChart
                                xAxis={[barXAxis]}
                                series={barSeries}
                                height={240}
                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                            />
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Spending distribution
                            </Typography>
                            <PieChart
                                series={pieSeries}
                                height={240}
                                margin={{ top: 20, right: 20, bottom: 30, left: 20 }}
                            />
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={2} columns={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Categories
                            </Typography>
                            <SimpleTreeView
                                sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                            >
                                {treeData.map((node) => renderTree(node))}
                            </SimpleTreeView>
                        </Paper>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );
}
