# Contributing to JurisAI

Thank you for your interest in contributing to JurisAI! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Commit: `git commit -m "feat: add your feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

## Development Setup

```bash
# Clone the repo
git clone https://github.com/your-username/legalai.git
cd legalai

# Frontend
npm install
npm run dev

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # Fill in your keys
python main.py
```

## Code Style

### Frontend (React + Vite)
- Use functional components with hooks
- Follow existing file naming: `PascalCase.jsx` for components
- Use Tailwind CSS for styling
- Keep components in `src/components/`

### Backend (FastAPI + Python)
- Follow PEP 8
- Use type hints
- Keep routes in `api/routes/`
- Keep business logic in `services/`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `style:` — formatting, no code change
- `refactor:` — code restructuring
- `test:` — adding tests
- `chore:` — maintenance

## Pull Request Guidelines

- Keep PRs focused on one change
- Include a clear description
- Reference any related issues
- Ensure no secrets are committed
- Update documentation if needed

## Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Include your environment (OS, Python version, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
