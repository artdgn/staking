import React, { useMemo } from 'react';
import Head from 'next/head';
import styled from 'styled-components';

import { useTranslation } from 'react-i18next';

import { FlexDivCol, FlexDivRowCentered } from 'styles/common';
import { PossibleActions, BarStats } from 'sections/dashboard';

import useGetDebtDataQuery from 'queries/debt/useGetDebtDataQuery';
import useFeeClaimHistoryQuery from 'queries/staking/useFeeClaimHistoryQuery';
import useGetFeePoolDataQuery from 'queries/staking/useGetFeePoolDataQuery';
import StatBox from 'components/StatBox';
import useCurrencyRatesQuery from 'queries/rates/useCurrencyRatesQuery';
import { formatFiatCurrency, formatPercent } from 'utils/formatters/number';
import useTotalIssuedSynthsExcludingEtherQuery from 'queries/synths/useTotalIssuedSynthsExcludingEtherQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';

const DashboardPage = () => {
	const { t } = useTranslation();

	const history = useFeeClaimHistoryQuery();

	const currentFeePeriod = useGetFeePoolDataQuery('0');
	const debtDataQuery = useGetDebtDataQuery();
	const currencyRates = useCurrencyRatesQuery(['SNX']);
	const totalIssuedSynthsExclEth = useTotalIssuedSynthsExcludingEtherQuery('sUSD');
	const exchangeRates = useExchangeRatesQuery();
	const previousFeePeriod = useGetFeePoolDataQuery('1');

	const currentCRatio = debtDataQuery.data?.currentCRatio ?? 0;
	const targetCRatio = debtDataQuery.data?.targetCRatio ?? 0;

	// TODO: replace with useMemo
	// eslint-disable-next-line
	const activeDebt = debtDataQuery.data?.debtBalance ?? 0;
	const collateral = debtDataQuery.data?.collateral ?? 0;
	const sUSDRate = exchangeRates.data?.sUSD ?? 0;
	const feesToDistribute = previousFeePeriod?.data?.feesToDistribute ?? 0;
	const rewardsToDistribute = previousFeePeriod?.data?.rewardsToDistribute ?? 0;
	const totalsUSDDebt = totalIssuedSynthsExclEth?.data ?? 0;

	// TODO: replace with useMemo
	// eslint-disable-next-line
	const nextFeePeriodStarts = new Date(
		currentFeePeriod.data?.startTime
			? (currentFeePeriod.data.startTime + currentFeePeriod.data.feePeriodDuration) * 1000
			: 0
	);

	// TODO: replace with useMemo
	// eslint-disable-next-line
	const currentFeePeriodStarts = new Date(
		currentFeePeriod.data?.startTime ? currentFeePeriod.data.startTime * 1000 : 0
	);

	// TODO: replace with useMemo
	// eslint-disable-next-line
	const currentFeePeriodProgress = currentFeePeriod.data?.startTime
		? (Date.now() / 1000 - currentFeePeriod.data.startTime) /
		  currentFeePeriod.data.feePeriodDuration
		: 0;

	// TODO: replace with selected currency instead of usd hardcode
	// eslint-disable-next-line
	const SNXRate = currencyRates.data?.SNX ?? 0;
	const stakedValue = collateral * Math.min(1, currentCRatio / targetCRatio) * SNXRate;

	// TODO: replace with useMemo
	const weeklyRewards = sUSDRate * feesToDistribute + SNXRate * rewardsToDistribute;
	const stakingApy = (weeklyRewards * (activeDebt / totalsUSDDebt) * 52) / (stakedValue * SNXRate);

	const checkClaimedStatus = useMemo(
		() =>
			history.data
				? history.data?.some((tx) => {
						const claimedDate = new Date(tx.timestamp);
						return claimedDate > currentFeePeriodStarts && claimedDate < nextFeePeriodStarts;
				  })
				: false,
		[history, currentFeePeriodStarts, nextFeePeriodStarts]
	);

	const claimed = checkClaimedStatus;

	return (
		<Content>
			<Head>
				<title>{t('dashboard.page-title')}</title>
			</Head>
			<StatsSection>
				<StyledStakedValue
					title={t('common.stat-box.staked-value')}
					value={formatFiatCurrency(stakedValue ? stakedValue : 0, { sign: '$' })}
				/>
				<StyledAPY
					title={t('common.stat-box.earning')}
					value={formatPercent(stakingApy ? stakingApy : 0)}
				/>
				<StyledActiveDebt
					title={t('common.stat-box.active-debt')}
					value={formatFiatCurrency(activeDebt ? activeDebt : 0, { sign: '$' })}
				/>
			</StatsSection>
			<BarStats
				currentCRatio={currentCRatio}
				targetCRatio={targetCRatio}
				claimed={claimed}
				nextFeePeriodStarts={nextFeePeriodStarts}
				currentFeePeriodProgress={currentFeePeriodProgress}
			/>
			<PossibleActions claimAmount={20} sUSDAmount={2000} SNXAmount={400} earnPercent={0.15} />
		</Content>
	);
};

const Content = styled(FlexDivCol)`
	width: 100%;
	max-width: 1200px;
`;

const StatsSection = styled(FlexDivRowCentered)`
	width: 100%;
	justify-content: center;
	margin: 0 auto;
`;

const StyledStakedValue = styled(StatBox)`
	.title {
		color: ${(props) => props.theme.colors.brightBlue};
	}
`;
const StyledAPY = styled(StatBox)`
	transform: scale(1.1);
	.title {
		color: ${(props) => props.theme.colors.brightGreen};
	}
	.value {
		text-shadow: rgba(65, 199, 157, 1) 0px 0px 4px, rgba(65, 199, 157, 1) 0px 0px 4px,
			rgba(65, 199, 157, 1) 0px 0px 4px, rgba(65, 199, 157, 1) 0px 0px 4px,
			rgba(65, 199, 157, 1) 0px 0px 4px, rgba(65, 199, 157, 1) 0px 0px 4px;
		color: #073124;
	}
`;
const StyledActiveDebt = styled(StatBox)`
	.title {
		color: ${(props) => props.theme.colors.brightPink};
	}
`;

export default DashboardPage;
