const toNumber = (value) => Number(value) || 0;

export function applyAverageCostExit(position, shares) {
  const currentShares = toNumber(position?.shares);
  const currentCost = toNumber(position?.cost);
  const exitShares = toNumber(shares);
  const averageCost = currentShares > 0 ? currentCost / currentShares : 0;
  const estimatedBasis = averageCost * exitShares;

  return {
    shares: Math.max(0, currentShares - exitShares),
    cost: Math.max(0, currentCost - estimatedBasis),
    estimatedBasis,
  };
}
