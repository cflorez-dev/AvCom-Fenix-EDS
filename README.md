# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on [www.aem.live](https://www.aem.live/docs/) and [experienceleague.adobe.com](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/authoring), more specifically:
1. [Getting Started](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/edge-dev-getting-started), [Creating Blocks](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/create-block), [Content Modelling](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/content-modeling)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

Furthremore, we encourage you to watch the recordings of any of our previous presentations or sessions:
- [Getting started with AEM Authoring and Edge Delivery Services](https://experienceleague.adobe.com/en/docs/events/experience-manager-gems-recordings/gems2024/aem-authoring-and-edge-delivery)

## Prerequisites

- nodejs 18.3.x or newer
- AEM Cloud Service release 2024.8 or newer (>= `17465`)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Build Process

The project uses automated build steps to ensure all assets are properly compiled before deployment:

### Manual Build
```sh
npm run build
```

This command runs in parallel:
- **Component Models** (`build:json`) - Merges component JSON configurations
- **Dropins** (`build:dropins`) - Copies vendorized dependencies to `scripts/__dropins__/`
- **Tailwind CSS** (`tw:build`) - Compiles CSS with all classes (including arbitrary values)

### Automatic Pre-commit Hooks

The project uses Husky to automatically:
1. **Compile Tailwind CSS** when you modify:
   - Files in `blocks/` or `design-system/` folders
   - CSS variables in `styles/variables/`
   - Tailwind configuration files
2. **Rebuild component models** when you modify JSON partials

**Important**: Always ensure `styles/tw.css` is committed after modifying components that use new Tailwind classes (especially arbitrary values like `grid-rows-[repeat(3,minmax(0,1fr))]`).

## Local development

### Development Mode (with hot-reload)
```sh
npm run dev
```

This starts:
- AEM local server at `http://localhost:3000`
- Tailwind CSS watch mode (auto-compiles on file changes)

### Standard Mode
1. Create a new repository based on the `aem-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
