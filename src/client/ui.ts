/**
 * UI utilities for the Slipstream client
 * Provides visual feedback for daemon operations and command execution
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class UI {
  private spinner: Ora | null = null;
  private verbose: boolean;

  constructor(verbose: boolean = false, colorEnabled: boolean = true) {
    this.verbose = verbose;
    
    if (!colorEnabled) {
      chalk.level = 0;
    }
  }

  /**
   * Show a spinner with a message
   */
  startSpinner(message: string): void {
    this.spinner = ora({
      text: message,
      color: 'cyan',
    }).start();
  }

  /**
   * Update spinner text
   */
  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop spinner with success
   */
  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with info
   */
  infoSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    }
  }

  /**
   * Print success message
   */
  success(message: string): void {
    console.log(chalk.green('✔') + ' ' + message);
  }

  /**
   * Print error message
   */
  error(message: string): void {
    console.error(chalk.red('✖') + ' ' + message);
  }

  /**
   * Print info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ') + ' ' + message);
  }

  /**
   * Print warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠') + ' ' + message);
  }

  /**
   * Print verbose/debug message (only if verbose mode is enabled)
   */
  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('[DEBUG]') + ' ' + message);
    }
  }

  /**
   * Print a blank line
   */
  newline(): void {
    console.log();
  }

  /**
   * Format a command for display
   */
  command(cmd: string): string {
    return chalk.cyan(cmd);
  }

  /**
   * Format a path for display
   */
  path(path: string): string {
    return chalk.underline(path);
  }

  /**
   * Stream output line by line
   */
  streamLine(line: string): void {
    console.log(line);
  }

  /**
   * Display a header
   */
  header(title: string): void {
    console.log();
    console.log(chalk.bold.cyan(title));
    console.log(chalk.gray('─'.repeat(title.length)));
  }
}
