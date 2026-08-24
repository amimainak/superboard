'use client'

import React, { lazy, Suspense } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'

// ============================================================
// Generic On-Canvas Science Widget Renderer
// Wraps panel-side science tools for placement on the board.
// Each panel component takes { isDark: boolean }.
// ============================================================

interface CanvasScienceWidgetProps {
  element: WidgetElement
  isDark: boolean
}

// ---- Lazy-loaded panel components ----

const PhysicsFormulaCalc = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.PhysicsFormulaCalculator })))
const WaveSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.WaveSimulator })))
const PendulumSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.PendulumSimulator })))
const ScienceUnitConv = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.ScienceUnitConverter })))
const ProjectileSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.ProjectileMotionSimulator })))
const OhmsLaw = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.OhmsLawCalculator })))
const CircuitDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.CircuitDiagramBuilder })))
const FreeBodyDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.FreeBodyDiagramBuilder })))
const RayDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.RayDiagramOptics })))
const EnergyBar = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.EnergyBarCharts })))
const InteractiveGraph = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.InteractiveGraphingTool })))

const PhScale = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.PhScaleVisualizer })))
const SciNotation = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.ScientificNotationConverter })))
const PeriodicTable = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.PeriodicTableExplorer })))
const EqBalancer = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.ChemicalEquationBalancer })))
const MolarMass = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.MolarMassCalculator })))
const LewisDot = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.LewisDotStructureBuilder })))
const VSEPR = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.MolecularGeometryVSEPR })))
const GasLaws = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.GasLawsSimulator })))
const Titration = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.AcidBaseTitration })))
const IonFormation = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.IonFormationVisualizer })))

const PunnettSquare = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.PunnettSquareCalculator })))
const CellDiagram = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.CellDiagramExplorer })))
const Taxonomy = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.TaxonomyClassifier })))
const BodySystems = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.BodySystemsExplorer })))
const FoodWeb = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.EcologyFoodWeb })))
const DNAStructure = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.DNAStructureViewer })))
const NaturalSelection = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.NaturalSelectionSim })))
const CellDivision = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.CellDivisionAnimator })))
const PhotoResp = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.PhotosynthesisRespiration })))
const HumanBody = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.HumanBodyInteractive })))

const RockCycle = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.RockCycleDiagram })))
const PlateTectonics = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.PlateTectonicsMap })))
const WeatherMap = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.WeatherMapReader })))
const WaterCarbon = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.WaterCarbonCycle })))
const SolarSystem = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.SolarSystemScale })))
const Topographic = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.TopographicMapTool })))

// ---- Component map ----

const SCIENCE_PANEL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ isDark: boolean }>>> = {
  'phys-formula-calc': PhysicsFormulaCalc,
  'phys-wave-sim': WaveSim,
  'phys-pendulum-sim': PendulumSim,
  'phys-unit-converter': ScienceUnitConv,
  'phys-projectile-sim': ProjectileSim,
  'phys-ohms-law': OhmsLaw,
  'phys-circuit-diagram': CircuitDiag,
  'phys-free-body-diagram': FreeBodyDiag,
  'phys-ray-diagram': RayDiag,
  'phys-energy-bar-charts': EnergyBar,
  'phys-interactive-graphing': InteractiveGraph,

  'chem-ph-scale': PhScale,
  'chem-sci-notation': SciNotation,
  'chem-periodic-table': PeriodicTable,
  'chem-equation-balancer': EqBalancer,
  'chem-molar-mass': MolarMass,
  'chem-lewis-dot': LewisDot,
  'chem-vsepr': VSEPR,
  'chem-gas-laws': GasLaws,
  'chem-titration': Titration,
  'chem-ion-formation': IonFormation,

  'bio-punnett-square': PunnettSquare,
  'bio-cell-diagram': CellDiagram,
  'bio-taxonomy': Taxonomy,
  'bio-body-systems': BodySystems,
  'bio-food-web': FoodWeb,
  'bio-dna-structure': DNAStructure,
  'bio-natural-selection': NaturalSelection,
  'bio-cell-division': CellDivision,
  'bio-photosynthesis-resp': PhotoResp,
  'bio-human-body': HumanBody,

  'earth-rock-cycle': RockCycle,
  'earth-plate-tectonics': PlateTectonics,
  'earth-weather-map': WeatherMap,
  'earth-water-carbon-cycle': WaterCarbon,
  'earth-solar-system': SolarSystem,
  'earth-topographic-map': Topographic,
}

// ---- Renderer ----

export const CanvasScienceWidgetRenderer = React.memo(function CanvasScienceWidgetRenderer({ element, isDark }: CanvasScienceWidgetProps) {
  const PanelComponent = SCIENCE_PANEL_MAP[element.widgetKind]

  if (!PanelComponent) {
    return (
      <div style={{ padding: 12, color: '#f87171', fontSize: 12 }}>
        Unknown science widget: {element.widgetKind}
      </div>
    )
  }

  const bg = isDark ? '#0f172a' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: bg,
      color: text,
      overflow: 'auto',
      borderRadius: 8,
      padding: 8,
      boxSizing: 'border-box',
    }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, fontSize: 11 }}>
          Loading...
        </div>
      }>
        <PanelComponent isDark={isDark} />
      </Suspense>
    </div>
  )
})

// ---- Default configs ----

export function getScienceWidgetDefaultConfig(kind: string): Record<string, unknown> {
  return {}
}

// ---- Default sizes ----

export function getScienceWidgetDefaultSize(kind: string): { width: number; height: number } {
  // Periodic table is wider
  if (kind === 'chem-periodic-table') return { width: 580, height: 500 }
  // Tools with canvas/rendered visuals tend to be bigger
  if (kind === 'phys-wave-sim') return { width: 450, height: 400 }
  if (kind === 'phys-pendulum-sim') return { width: 400, height: 450 }
  if (kind === 'phys-projectile-sim') return { width: 450, height: 450 }
  if (kind === 'phys-circuit-diagram') return { width: 450, height: 450 }
  if (kind === 'phys-free-body-diagram') return { width: 400, height: 400 }
  if (kind === 'phys-ray-diagram') return { width: 450, height: 400 }
  if (kind === 'phys-energy-bar-charts') return { width: 420, height: 400 }
  if (kind === 'phys-interactive-graphing') return { width: 450, height: 450 }
  if (kind === 'chem-gas-laws') return { width: 450, height: 480 }
  if (kind === 'chem-titration') return { width: 450, height: 500 }
  if (kind === 'chem-vsepr') return { width: 400, height: 420 }
  if (kind === 'chem-lewis-dot') return { width: 400, height: 400 }
  if (kind === 'bio-food-web') return { width: 450, height: 450 }
  if (kind === 'bio-dna-structure') return { width: 400, height: 450 }
  if (kind === 'bio-cell-division') return { width: 420, height: 480 }
  if (kind === 'bio-human-body') return { width: 400, height: 500 }
  if (kind === 'earth-plate-tectonics') return { width: 480, height: 400 }
  if (kind === 'earth-topographic-map') return { width: 450, height: 420 }
  if (kind === 'earth-solar-system') return { width: 450, height: 400 }
  // Default for simpler tools
  return { width: 380, height: 400 }
}

// ---- Labels ----

export const SCIENCE_WIDGET_KIND_LABELS: Record<string, string> = {
  'phys-formula-calc': 'Physics Formula Calculator',
  'phys-wave-sim': 'Wave Simulator',
  'phys-pendulum-sim': 'Pendulum Simulator',
  'phys-unit-converter': 'Science Unit Converter',
  'phys-projectile-sim': 'Projectile Motion Simulator',
  'phys-ohms-law': "Ohm's Law Calculator",
  'phys-circuit-diagram': 'Circuit Diagram Builder',
  'phys-free-body-diagram': 'Free Body Diagram Builder',
  'phys-ray-diagram': 'Ray Diagram Optics',
  'phys-energy-bar-charts': 'Energy Bar Charts',
  'phys-interactive-graphing': 'Interactive Graphing Tool',
  'chem-ph-scale': 'pH Scale Visualizer',
  'chem-sci-notation': 'Scientific Notation Converter',
  'chem-periodic-table': 'Periodic Table Explorer',
  'chem-equation-balancer': 'Chemical Equation Balancer',
  'chem-molar-mass': 'Molar Mass Calculator',
  'chem-lewis-dot': 'Lewis Dot Structure Builder',
  'chem-vsepr': 'Molecular Geometry (VSEPR)',
  'chem-gas-laws': 'Gas Laws Simulator',
  'chem-titration': 'Acid-Base Titration',
  'chem-ion-formation': 'Ion Formation Visualizer',
  'bio-punnett-square': 'Punnett Square Calculator',
  'bio-cell-diagram': 'Cell Diagram Explorer',
  'bio-taxonomy': 'Taxonomy Classifier',
  'bio-body-systems': 'Body Systems Explorer',
  'bio-food-web': 'Ecology Food Web',
  'bio-dna-structure': 'DNA Structure Viewer',
  'bio-natural-selection': 'Natural Selection Sim',
  'bio-cell-division': 'Cell Division Animator',
  'bio-photosynthesis-resp': 'Photosynthesis & Respiration',
  'bio-human-body': 'Human Body Interactive',
  'earth-rock-cycle': 'Rock Cycle Diagram',
  'earth-plate-tectonics': 'Plate Tectonics Map',
  'earth-weather-map': 'Weather Map Reader',
  'earth-water-carbon-cycle': 'Water & Carbon Cycle',
  'earth-solar-system': 'Solar System Scale',
  'earth-topographic-map': 'Topographic Map Tool',
}
