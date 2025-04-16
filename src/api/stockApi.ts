// ... keep existing code (imports, API configuration, fetch functions)

export const getFinancialMetrics = async (ticker: string) => {
  try {
    const [quoteData, incomeStatements, balanceSheets, cashFlowStatements, keyMetrics] = await Promise.all([
      fetchStockQuote(ticker),
      fetchIncomeStatements(ticker),
      fetchBalanceSheets(ticker),
      fetchCashFlowStatements(ticker),
      fetchKeyMetrics(ticker)
    ]);
    
    // Check if we have data
    if (!incomeStatements || incomeStatements.length === 0 ||
        !balanceSheets || balanceSheets.length === 0 ||
        !cashFlowStatements || cashFlowStatements.length === 0) {
      console.error('Missing financial statements for', ticker);
      throw new Error(`Keine ausreichenden Finanzdaten für ${ticker} verfügbar`);
    }
    
    // Get the latest statements
    const latestIncomeStatement = incomeStatements[0];
    const latestBalanceSheet = balanceSheets[0];
    const latestCashFlowStatement = cashFlowStatements[0];
    const latestKeyMetrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    
    // Calculate financial metrics
    let eps = 0;
    let roe = 0;
    let netMargin = 0;
    let roic = 0;
    let debtToAssets = 0;
    let interestCoverage = 0;
    let fcf = 0; // Add Free Cash Flow variable
    
    // EPS
    if (latestIncomeStatement && latestIncomeStatement.eps) {
      eps = latestIncomeStatement.eps;
    } else if (latestKeyMetrics && latestKeyMetrics.eps) {
      eps = latestKeyMetrics.eps;
    }
    
    // ROE (Return on Equity)
    if (latestIncomeStatement && latestBalanceSheet) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const shareholderEquity = latestBalanceSheet.totalStockholdersEquity || 0;
      
      if (shareholderEquity !== 0) {
        roe = netIncome / shareholderEquity;
      }
    }
    
    // Net Margin
    if (latestIncomeStatement) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const revenue = latestIncomeStatement.revenue || 0;
      
      if (revenue !== 0) {
        netMargin = netIncome / revenue;
      }
    }
    
    // ROIC (Return on Invested Capital)
    if (latestIncomeStatement && latestBalanceSheet) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      const shareholderEquity = latestBalanceSheet.totalStockholdersEquity || 0;
      const investedCapital = totalDebt + shareholderEquity;
      
      if (investedCapital !== 0) {
        roic = netIncome / investedCapital;
      }
    }
    
    // Debt to Assets
    if (latestBalanceSheet) {
      const totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      const totalAssets = latestBalanceSheet.totalAssets || 1; // Avoid division by zero
      
      debtToAssets = totalDebt / totalAssets;
    }
    
    // Interest Coverage Ratio
    if (latestIncomeStatement) {
      const ebit = latestIncomeStatement.ebit || latestIncomeStatement.operatingIncome || 0;
      const interestExpense = Math.abs(latestIncomeStatement.interestExpense || 0);
      
      if (interestExpense !== 0) {
        interestCoverage = ebit / interestExpense;
      } else {
        // If no interest expense, set to a high value to indicate strong coverage
        interestCoverage = 100;
      }
    }
    
    // Calculate FCF from cash flow statements
    if (latestCashFlowStatement) {
      const operatingCashFlow = latestCashFlowStatement.operatingCashFlow || 0;
      const capex = latestCashFlowStatement.capitalExpenditure || 0;
      
      // Free Cash Flow = Operating Cash Flow - Capital Expenditures
      fcf = operatingCashFlow + capex; // capex is usually negative, so we add it
      
      console.log(`FCF calculation: ${operatingCashFlow} + (${capex}) = ${fcf}`);
    }
    
    // Determine the currency of the financial statements
    let reportedCurrency = 'USD'; // Default to USD
    
    if (latestIncomeStatement && latestIncomeStatement.reportedCurrency) {
      reportedCurrency = latestIncomeStatement.reportedCurrency;
    } else if (quoteData && quoteData.currency) {
      reportedCurrency = quoteData.currency;
    }
    
    // Prepare historical data (last 10 years if available)
    const historicalData = {
      revenue: [],
      earnings: [],
      eps: []
    };
    
    // Get up to 10 years of data
    const yearsToInclude = Math.min(10, incomeStatements.length);
    
    for (let i = 0; i < yearsToInclude; i++) {
      const statement = incomeStatements[i];
      if (statement) {
        const year = statement.date ? statement.date.substring(0, 4) : `Year-${i}`;
        
        historicalData.revenue.push({
          year,
          value: statement.revenue || 0,
          originalCurrency: reportedCurrency
        });
        
        historicalData.earnings.push({
          year,
          value: statement.netIncome || 0,
          originalCurrency: reportedCurrency
        });
        
        historicalData.eps.push({
          year,
          value: statement.eps || 0,
          originalCurrency: reportedCurrency
        });
      }
    }
    
    return {
      // Existing metrics
      eps,
      roe,
      netMargin,
      roic,
      debtToAssets,
      interestCoverage,
      
      // Add FCF to returned metrics
      fcf,
      
      // Add the reported currency to the returned object
      reportedCurrency,
      
      // Historical data
      historicalData,
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

// ... keep existing code (other API functions)
