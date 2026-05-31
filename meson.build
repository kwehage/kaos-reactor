project('noise-reactor', 'cpp',
  version : '0.0.1',
  default_options : ['cpp_std=c++20', 'warning_level=2'])

qt6         = import('qt6')
fs          = import('fs')
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
# Qt's host-tool dir (rcc, qsb, etc.) is not always in PATH.
# Try host_bins first (set on MSYS2/Qt upstream builds), fall back to bindir
# (used on Debian/Ubuntu packages).  Both resolve to the same private Qt bin dir.
_qt_hostbins = run_command('pkg-config', '--variable=host_bins', 'Qt6Core',
                           check : false).stdout().strip()
if _qt_hostbins == ''
  _qt_hostbins = run_command('pkg-config', '--variable=bindir', 'Qt6Core',
                             check : false).stdout().strip()
endif
# Some distros (Ubuntu's Qt 6.4) place rcc one level above bindir (/usr/lib/qt6/rcc)
# while bindir itself only contains newer tools like qsb (/usr/lib/qt6/bin/qsb).
_qt_parent = fs.parent(_qt_hostbins)
qsb = find_program([_qt_hostbins / 'qsb', _qt_hostbins / 'qsb6', 'qsb6', 'qsb'],
                   required : true)
rcc = find_program([_qt_hostbins / 'rcc', _qt_hostbins / 'rcc6',
                    _qt_parent / 'rcc', _qt_parent / 'rcc6',
                    'rcc6', 'rcc'],
                   required : true)

vert_qsb = custom_target('image_vert_qsb',
  input   : 'shaders/image.vert',
  output  : 'image.vert.qsb',
  command : [qsb, '--glsl', '300 es,330', '-o', '@OUTPUT@', '@INPUT@'],
)

frag_qsb = custom_target('image_frag_qsb',
  input   : 'shaders/image.frag',
  output  : 'image.frag.qsb',
  command : [qsb, '--glsl', '300 es,330', '-o', '@OUTPUT@', '@INPUT@'],
)

composite_qsb = custom_target('composite_frag_qsb',
  input   : 'shaders/composite.frag',
  output  : 'composite.frag.qsb',
  command : [qsb, '--glsl', '300 es,330', '-o', '@OUTPUT@', '@INPUT@'],
)

# Copy the QRC into the build directory so rcc resolves the .qsb references
# relative to the same directory where the generated shader bundles land.
shader_qrc = configure_file(
  input  : 'shaders/shaders.qrc',
  output : 'shaders.qrc',
  copy   : true,
)

shader_res = custom_target('shader_resources',
  input   : shader_qrc,
  output  : 'qrc_shaders.cpp',
  command : [rcc, '@INPUT@', '--name', 'shaders', '-o', '@OUTPUT@'],
  depends : [vert_qsb, frag_qsb, composite_qsb],
)

# ── C++ sources ───────────────────────────────────────────────────────────────
sources = files(
  'noise_reactor/main.cc',
  'noise_reactor/app.cc',
  'noise_reactor/audio_file.cc',
  'noise_reactor/audio_analyzer.cc',
  'noise_reactor/preview_widget.cc',
  'noise_reactor/waveform_widget.cc',
  'noise_reactor/cinematic_target_widget.cc',
)

moc_files = qt6.preprocess(
  moc_headers     : ['noise_reactor/app.h', 'noise_reactor/preview_widget.h',
                     'noise_reactor/waveform_widget.h',
                     'noise_reactor/cinematic_target_widget.h'],
  include_directories : inc,
  dependencies    : qt6_dep,
)

executable('noise_reactor',
  sources,
  moc_files,
  shader_res,
  dependencies    : [qt6_dep, sndfile_dep, fftw3f_dep],
  include_directories : [inc, rhi_inc],
  install         : true,
)
