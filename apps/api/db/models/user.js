'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      })

      User.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      })

      User.hasMany(models.User, {
        foreignKey: 'created_by',
        as: 'createdUsers'
      })
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: DataTypes.STRING(100),
      email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        validate: { isEmail: true }
      },
      password: DataTypes.STRING,
      role_id: DataTypes.UUID,
      created_by: DataTypes.UUID,
      avatar: DataTypes.STRING(255),
      last_updated_password: DataTypes.DATE,
      last_activity: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      underscored: true
    }
  )
  return User
}