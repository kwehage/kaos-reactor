#include "noise_reactor/export_dialog.h"

#include <QButtonGroup>
#include <QComboBox>
#include <QDialogButtonBox>
#include <QDir>
#include <QFileDialog>
#include <QFormLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QRadioButton>
#include <QStandardItem>
#include <QStandardItemModel>
#include <QVBoxLayout>

namespace noise_reactor {

ExportDialog::ExportDialog(QWidget* parent) : QDialog(parent) {
    setWindowTitle("Export Video");
    setMinimumWidth(420);

    auto* layout = new QVBoxLayout(this);
    layout->setSpacing(12);

    // ── Resolution ────────────────────────────────────────────────────────────
    auto* res_label = new QLabel("Resolution");
    res_label->setStyleSheet("color: #888; font-size: 11px; font-weight: bold;");
    layout->addWidget(res_label);

    resolution_combo_ = new QComboBox();
    auto* model = new QStandardItemModel(this);

    auto add_header = [&](const QString& text) {
        auto* item = new QStandardItem("  " + text);
        item->setEnabled(false);
        QFont f = item->font();
        f.setBold(true);
        item->setFont(f);
        item->setForeground(QColor("#666"));
        model->appendRow(item);
    };
    auto add_preset = [&](const QString& label, int w, int h) {
        auto* item = new QStandardItem(
            QString("    %1  (%2 × %3)").arg(label).arg(w).arg(h));
        item->setData(QSize(w, h), Qt::UserRole);
        model->appendRow(item);
    };

    add_header("YouTube / Web");
    add_preset("720p HD",       1280, 720);
    add_preset("1080p Full HD", 1920, 1080);
    add_preset("2K QHD",        2560, 1440);
    add_preset("4K UHD",        3840, 2160);
    add_header("Instagram Feed");
    add_preset("Square (1:1)",   1080, 1080);
    add_preset("Portrait (4:5)", 1080, 1350);
    add_header("Reels / TikTok / Shorts");
    add_preset("Vertical (9:16)", 1080, 1920);

    resolution_combo_->setModel(model);
    // Default: 1080p Full HD (index 2, after the YouTube header at 0)
    resolution_combo_->setCurrentIndex(2);
    layout->addWidget(resolution_combo_);

    // ── Frame rate ────────────────────────────────────────────────────────────
    auto* fps_label = new QLabel("Frame Rate");
    fps_label->setStyleSheet("color: #888; font-size: 11px; font-weight: bold;");
    layout->addWidget(fps_label);

    auto* fps_row = new QHBoxLayout();
    fps_group_     = new QButtonGroup(this);
    for (int fps : {24, 30, 60}) {
        auto* rb = new QRadioButton(QString("%1 fps").arg(fps));
        fps_group_->addButton(rb, fps);
        fps_row->addWidget(rb);
        if (fps == 30) rb->setChecked(true);
    }
    fps_row->addStretch();
    layout->addLayout(fps_row);

    // ── Output file ───────────────────────────────────────────────────────────
    auto* file_label = new QLabel("Output File");
    file_label->setStyleSheet("color: #888; font-size: 11px; font-weight: bold;");
    layout->addWidget(file_label);

    auto* file_row = new QHBoxLayout();
    output_path_   = new QLineEdit(QDir::homePath() + "/output.mp4");
    auto* browse   = new QPushButton("Browse…");
    browse->setFixedWidth(72);
    connect(browse, &QPushButton::clicked, this, &ExportDialog::browse_output);
    file_row->addWidget(output_path_);
    file_row->addWidget(browse);
    layout->addLayout(file_row);

    // ── Buttons ───────────────────────────────────────────────────────────────
    layout->addSpacing(4);
    auto* buttons = new QDialogButtonBox(
        QDialogButtonBox::Ok | QDialogButtonBox::Cancel);
    buttons->button(QDialogButtonBox::Ok)->setText("Export");
    connect(buttons, &QDialogButtonBox::accepted, this, &QDialog::accept);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    layout->addWidget(buttons);
}

ExportSettings ExportDialog::settings() const {
    auto* m    = qobject_cast<QStandardItemModel*>(resolution_combo_->model());
    QSize size = m->item(resolution_combo_->currentIndex())
                  ->data(Qt::UserRole).toSize();
    return {
        .width       = size.width(),
        .height      = size.height(),
        .fps         = fps_group_->checkedId(),
        .output_path = output_path_->text(),
    };
}

void ExportDialog::browse_output() {
    QString path = QFileDialog::getSaveFileName(
        this, "Export Video", output_path_->text(),
        "Video Files (*.mp4)", nullptr, QFileDialog::DontUseNativeDialog);
    if (!path.isEmpty()) {
        if (!path.endsWith(".mp4", Qt::CaseInsensitive))
            path += ".mp4";
        output_path_->setText(path);
    }
}

} // namespace noise_reactor
