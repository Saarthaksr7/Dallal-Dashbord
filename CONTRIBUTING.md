# Contributing to Dallal Dashboard

First off, thank you for considering contributing to Dallal Dashboard! It's people like you that make this project such a great tool for the homelab community.

## 🎯 Project Vision

Dallal Dashboard aims to be the go-to service management platform for homelab enthusiasts, providing:
- Enterprise-grade security for home networks
- Intuitive service monitoring and management
- Docker container orchestration
- Beautiful, performant UI

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** - Use a descriptive title
- **Steps to reproduce** - Provide specific steps
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Environment** - OS, Docker version, browser, etc.
- **Screenshots** - If applicable
- **Logs** - Include relevant log output

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Ubuntu 22.04]
- Docker Version: [e.g. 24.0.5]
- Browser: [e.g. Chrome 120]
- Dallal Version: [e.g. 2.0.0]

**Additional context**
Any other relevant information.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title** - Describe the enhancement
- **Provide context** - Explain why this would be useful
- **Describe the solution** - How you envision it working
- **Consider alternatives** - Other approaches you've considered

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/amazing-feature`
3. **Commit your changes** - `git commit -m 'Add amazing feature'`
4. **Push to the branch** - `git push origin feature/amazing-feature`
5. **Open a Pull Request**

**PR Guidelines:**
- Follow the existing code style
- Add tests if applicable
- Update documentation
- Keep PRs focused on a single feature/fix
- Reference related issues

## 🎨 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Docker & Docker Compose

### Local Development

```bash
# Clone the repository
git clone https://github.com/Saarthaksr7/Dallal-Dashbord.git
cd Dallal-Dashbord

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup (new terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Access the app at http://localhost:5173

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

## 📝 Code Style

### Frontend (React/JavaScript)
- Use functional components with hooks
- Follow existing component structure
- Use meaningful variable names
- Add comments for complex logic
- Keep components focused and reusable

### Backend (Python/FastAPI)
- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Keep functions focused and testable
- Use async/await for I/O operations

### Commit Messages
Use semantic commit messages:

```
feat: Add service import feature
fix: Resolve Docker connection timeout
docs: Update deployment guide
style: Format Settings page
refactor: Simplify API client
test: Add pagination tests
chore: Update dependencies
```

## 🏗️ Project Structure

```
Dallal-Dashbord/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── store/        # State management
│   └── ...
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Core utilities
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   └── ...
└── docs/              # Documentation
```

## 🔍 Review Process

1. **Automated Checks** - CI/CD runs linting and tests
2. **Code Review** - Maintainer reviews code
3. **Testing** - Changes are tested locally
4. **Merge** - PR is merged after approval

## 📚 Documentation

Help improve our documentation:
- Fix typos and clarify confusing sections
- Add examples and use cases
- Create tutorials and guides
- Improve API documentation

## 🌟 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated in the community!

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and ideas
- **Pull Requests** - Code contributions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to open an issue with the `question` label or start a discussion.

---

**Thank you for contributing to Dallal Dashboard! 🎉**

Made with ❤️ by SR7 and the community
