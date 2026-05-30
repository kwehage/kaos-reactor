#pragma once

#include <QDialog>
#include <QString>

QT_FORWARD_DECLARE_CLASS(QButtonGroup)
QT_FORWARD_DECLARE_CLASS(QComboBox)
QT_FORWARD_DECLARE_CLASS(QLineEdit)

namespace noise_reactor {

struct ExportSettings {
    int     width{1920};
    int     height{1080};
    int     fps{30};
    QString output_path;
};

class ExportDialog : public QDialog {
    Q_OBJECT
public:
    explicit ExportDialog(QWidget* parent = nullptr);
    ExportSettings settings() const;

private slots:
    void browse_output();

private:
    QComboBox*    resolution_combo_{nullptr};
    QButtonGroup* fps_group_{nullptr};
    QLineEdit*    output_path_{nullptr};
};

} // namespace noise_reactor
