# Contributing to Slipstream

Thank you for your interest in contributing to Slipstream! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rothnic/slipstream.git
   cd slipstream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Link for local testing**
   ```bash
   npm link
   ```

## Development Workflow

### Building

- **Development build with watch mode:**
  ```bash
  npm run dev
  ```

- **Production build:**
  ```bash
  npm run build
  ```

### Type Checking

Run TypeScript type checking without emitting files:
```bash
npm run typecheck
```

### Testing

Run tests with Vitest:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Project Structure

```
slipstream/
├── bin/               # Executable entry point
├── src/
│   ├── client/       # CLI client code
│   ├── daemon/       # Background daemon server
│   ├── config/       # Configuration schemas and defaults
│   └── utils/        # Shared utilities
├── dist/             # Compiled output (gitignored)
└── tests/            # Test files (to be added)
```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns and naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

## Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: Add your feature description"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test additions/changes
   - `chore:` for maintenance tasks

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Areas for Contribution

### High Priority
- Full OpenCode SDK integration
- Streaming output implementation
- Error handling improvements
- Comprehensive test suite

### Medium Priority
- Oh My Zsh plugin
- Configuration validation improvements
- Logging system
- Documentation improvements

### Low Priority
- Additional UI themes
- Performance optimizations
- Additional configuration options

## Questions or Problems?

- Open an issue on GitHub
- Check existing issues for similar problems
- Review the README for usage information

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
