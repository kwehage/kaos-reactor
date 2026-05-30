project('noise-reactor', 'cpp',
  version : '0.1.0',
  default_options : ['cpp_std=c++20', 'warning_level=2'])

qt6         = import('qt6')
qt6_dep     = dependency('qt6', modules : ['Core', 'Widgets', 'Gui', 'Concurrent', 'Multimedia'])
sndfile_dep = dependency('sndfile')
fftw3f_dep  = dependency('fftw3f')

inc = include_directories('.')

# RHI headers live in a versioned subdirectory not exported by the default Qt6Gui
# include path.  Derive it from pkg-config so it stays correct across Qt upgrades.
_qt_inc = run_command('pkg-config', '--variable=includedir', 'Qt6Core',
                      check : true).stdout().strip()
_qt_ver = qt6_dep.version()
rhi_inc = include_directories(_qt_inc / 'QtGui' / _qt_ver / 'QtGui')

# ── GLSL → QSB (Qt shader bundle) ────────────────────────────────────────────
qsb = find_program('/usr/lib/qt6/bin/qsb', required : true)

vert_qsb = custom_target('image_vert_qsb',
  input   : 'shaders/image.vert',
  output  : 'image.vert.qsb',
  command : [qsb, '--glsl', '300 es,330', '-o', '@OUTPUT@', '@INPUT@'],
  build_by_default : true,
)

frag_qsb = custom_target('image_frag_qsb',
  input   : 'shaders/image.frag',
  output  : 'image.frag.qsb',
  command : [qsb, '--glsl', '300 es,330', '-o', '@OUTPUT@', '@INPUT@'],
  build_by_default : true,
)

# ── C++ sources ───────────────────────────────────────────────────────────────
sources = files(
  'noise_reactor/main.cc',
  'noise_reactor/app.cc',
  'noise_reactor/audio_file.cc',
  'noise_reactor/audio_analyzer.cc',
  'noise_reactor/preview_widget.cc',
  'noise_reactor/waveform_widget.cc',
  'noise_reactor/export_dialog.cc',
)

moc_files = qt6.preprocess(
  moc_headers     : ['noise_reactor/app.h', 'noise_reactor/preview_widget.h',
                     'noise_reactor/waveform_widget.h',
                     'noise_reactor/export_dialog.h'],
  include_directories : inc,
  dependencies    : qt6_dep,
)

executable('noise_reactor',
  sources,
  moc_files,
  vert_qsb,
  frag_qsb,
  dependencies    : [qt6_dep, sndfile_dep, fftw3f_dep],
  include_directories : [inc, rhi_inc],
)
