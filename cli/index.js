#!/usr/bin/env node
const axios = require('axios');
const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();

program
  .version('1.0.0')
  .description('Web Performance Analyzer CLI')
  .argument('<url>', 'URL to analyze')
  .option('-j, --json', 'Output as JSON')
  .option('-d, --deep', 'Run deep analysis using backend API')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue(`🚀 Analyzing ${url}...`));
      
      if (options.deep) {
        console.log(chalk.yellow('Deep analysis requires a SaaS API token in production. Attempting local API...'));
        try {
          const res = await axios.post('http://localhost:5000/api/deep/full', { url }, { headers: { Authorization: `Bearer CLI_MOCK_TOKEN` } });
          const data = res.data;
          console.log('\n' + chalk.bold.magenta('Deep Analysis Complete!'));
          console.log(chalk.white('-------------------'));
          console.log(`${chalk.bold('Overall Score:')} ${data.overall > 80 ? chalk.green(data.overall) : data.overall > 50 ? chalk.yellow(data.overall) : chalk.red(data.overall)}`);
          console.log(`${chalk.bold('Summary:')} ${data.summary}`);
          if (data.prioritizedActions && data.prioritizedActions.length > 0) {
            console.log(chalk.bold('\nTop Priorities:'));
            data.prioritizedActions.slice(0,3).forEach((a) => console.log(`- [${a.impact}] ${a.action}`));
          }
          console.log(chalk.white('-------------------'));
          return;
        } catch(e) {
          console.log(chalk.red('Local API failed or unauthorized. Falling back to basic analysis.'));
        }
      }

      // For demo, we call the public Google API directly if no backend specified
      // In production, this would call our SaaS API
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE`;
      
      const response = await axios.get(apiUrl);
      const { lighthouseResult } = response.data;
      const score = Math.round(lighthouseResult.categories.performance.score * 100);

      if (options.json) {
        console.log(JSON.stringify({ url, score, metrics: lighthouseResult.audits }, null, 2));
      } else {
        console.log('\n' + chalk.bold.green('Analysis Complete!'));
        console.log(chalk.white('-------------------'));
        console.log(`${chalk.bold('Performance Score:')} ${score > 90 ? chalk.green(score) : score > 50 ? chalk.yellow(score) : chalk.red(score)}`);
        console.log(`${chalk.bold('LCP:')} ${lighthouseResult.audits['largest-contentful-paint'].displayValue}`);
        console.log(`${chalk.bold('FCP:')} ${lighthouseResult.audits['first-contentful-paint'].displayValue}`);
        console.log(chalk.white('-------------------'));
      }
    } catch (err) {
      console.error(chalk.red('Error during analysis:'), err.message);
    }
  });

program.parse(process.argv);
